from datetime import datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from catalogo.models import CondicionEjemplar, EjemplarFisico, EstadoEjemplar, EstadoFicha, FichaRecurso
from catalogo.services import ejemplares_prestables, estado_tras_devolucion

from .models import (
    ESTADOS_ENTREGADOS,
    ESTADOS_PENDIENTES,
    ColaReserva,
    EstadoCola,
    EstadoPrestamo,
    Feriado,
    PoliticaPrestamo,
    Prestamo,
)


DIAS_POR_DEFECTO = 7
MAX_PRESTAMOS_POR_DEFECTO = 3

MAX_RENOVACIONES = 1

FACTOR_SUSPENSION_POR_DEFECTO = 2
DIAS_SUSPENSION_PERDIDA_POR_DEFECTO = 30


def hoy():
    return timezone.localdate()


def es_dia_habil(fecha):
    # La biblioteca atiende de lunes a viernes; weekday() 5 y 6 son sabado y domingo.
    if fecha.weekday() >= 5:
        return False
    return not Feriado.objects.filter(fecha=fecha).exists()


def sumar_dias_habiles(desde, n):
    fecha = desde
    contados = 0
    while contados < n:
        fecha += timedelta(days=1)
        if es_dia_habil(fecha):
            contados += 1
    return fecha


def dias_habiles_entre(inicio, fin):
    # Dias habiles despues de 'inicio' y hasta 'fin' (inclusive). 0 si fin <= inicio.
    dias = 0
    fecha = inicio
    while fecha < fin:
        fecha += timedelta(days=1)
        if es_dia_habil(fecha):
            dias += 1
    return dias


def limite_para_recoger(fecha_prestamo):
    # El usuario tiene hasta el final del siguiente dia habil para recoger su reserva.
    dia = sumar_dias_habiles(timezone.localdate(fecha_prestamo), 1)
    return timezone.make_aware(datetime.combine(dia, time.max))


def politica_de(usuario):
    return PoliticaPrestamo.objects.filter(tipo_usuario=usuario.tipo_usuario).first()


def calcular_fecha_limite(usuario):
    dias = usuario.get_max_loan_period()
    if dias is None:
        dias = DIAS_POR_DEFECTO
    return sumar_dias_habiles(hoy(), dias)


def marcar_vencidos():
    return Prestamo.objects.filter(estado=EstadoPrestamo.ACTIVO, fecha_limite__lt=hoy()).update(
        estado=EstadoPrestamo.VENCIDO,
    )


def cancelar_reservas(prestamos):
    with transaction.atomic():
        reservas = prestamos.select_for_update(of=('self',)).filter(estado=EstadoPrestamo.RESERVADO)
        ejemplares = list(reservas.values_list('ejemplar_fisico_id', flat=True))
        if not ejemplares:
            return 0
        total = Prestamo.objects.filter(
            ejemplar_fisico_id__in=ejemplares, estado=EstadoPrestamo.RESERVADO,
        ).update(estado=EstadoPrestamo.CANCELADO)
        reservados = EjemplarFisico.objects.filter(pk__in=ejemplares, estado=EstadoEjemplar.RESERVADO)
        reservados.filter(condicion=CondicionEjemplar.DANADO).update(estado=EstadoEjemplar.EN_MANTENIMIENTO)
        reservados.update(estado=EstadoEjemplar.DISPONIBLE)
        for ficha in FichaRecurso.objects.filter(ejemplares__pk__in=ejemplares).distinct():
            atender_cola(ficha)
        return total


def caducar_reservas():
    ahora = timezone.now()
    pendientes = Prestamo.objects.filter(estado=EstadoPrestamo.RESERVADO)
    vencidas = [r.pk for r in pendientes if limite_para_recoger(r.fecha_prestamo) < ahora]
    if not vencidas:
        return 0
    return cancelar_reservas(Prestamo.objects.filter(pk__in=vencidas))


def actualizar_estados():
    return marcar_vencidos(), caducar_reservas()


def aplicar_suspension(usuario, dias):
    if dias <= 0:
        return
    # Si ya estaba suspendido, el castigo se acumula al final del actual; si no, parte de hoy.
    inicio = usuario.suspendido_hasta if (usuario.suspendido_hasta and usuario.suspendido_hasta > hoy()) else hoy()
    usuario.suspendido_hasta = inicio + timedelta(days=dias)
    usuario.save(update_fields=['suspendido_hasta'])


def validar_puede_prestar(usuario, ficha):
    if usuario.suspendido_hasta and usuario.suspendido_hasta >= hoy():
        raise ValidationError(f'Estas suspendido de prestamos hasta el {usuario.suspendido_hasta}.')

    pendientes = Prestamo.objects.filter(usuario=usuario, estado__in=ESTADOS_PENDIENTES)

    if pendientes.filter(estado=EstadoPrestamo.VENCIDO).exists():
        raise ValidationError('Tienes prestamos vencidos. Devuelvelos antes de pedir otro recurso.')

    if pendientes.filter(ejemplar_fisico__ficha_recurso=ficha).exists():
        raise ValidationError('Ya tienes un ejemplar de este recurso prestado o reservado.')

    politica = politica_de(usuario)
    maximo = politica.max_prestamos_simultaneos if politica else MAX_PRESTAMOS_POR_DEFECTO
    if pendientes.count() >= maximo:
        raise ValidationError(f'Alcanzaste el maximo de {maximo} prestamos simultaneos.')


def unirse_a_cola(usuario, ficha):
    if usuario.suspendido_hasta and usuario.suspendido_hasta >= hoy():
        raise ValidationError(f'Estas suspendido de prestamos hasta el {usuario.suspendido_hasta}.')
    if ficha.estado_ficha != EstadoFicha.ACTIVA:
        raise ValidationError('Este recurso fue dado de baja y no se puede reservar.')
    if ejemplares_prestables(ficha).exists():
        raise ValidationError('Hay ejemplares disponibles; reserva directamente en vez de ponerte en cola.')
    if Prestamo.objects.filter(usuario=usuario, estado__in=ESTADOS_PENDIENTES, ejemplar_fisico__ficha_recurso=ficha).exists():
        raise ValidationError('Ya tienes un ejemplar de este recurso prestado o reservado.')
    if ColaReserva.objects.filter(usuario=usuario, ficha_recurso=ficha, estado=EstadoCola.ESPERANDO).exists():
        raise ValidationError('Ya estas en la cola de este recurso.')
    return ColaReserva.objects.create(usuario=usuario, ficha_recurso=ficha)


def _avisar_recurso_disponible(prestamo):
    from users.tasks import enviar_correo_task
    limite = limite_para_recoger(prestamo.fecha_prestamo)
    enviar_correo_task.delay(
        'Tu recurso en espera ya esta disponible - Sistema de Prestamos',
        (
            f'Hola {prestamo.usuario.first_name or prestamo.usuario.email},\n\n'
            f'El recurso "{prestamo.ejemplar_fisico.ficha_recurso.nombre}" que esperabas ya esta disponible '
            f'y quedo reservado a tu nombre. Recogelo antes del {limite:%d/%m/%Y}.\n\n'
            'Si no lo recoges a tiempo, pasara al siguiente de la cola.'
        ),
        [prestamo.usuario.email],
    )


def atender_cola(ficha):
    siguiente = (
        ColaReserva.objects.select_for_update(skip_locked=True)
        .filter(ficha_recurso=ficha, estado=EstadoCola.ESPERANDO)
        .order_by('fecha_solicitud')
        .first()
    )
    if siguiente is None:
        return
    usuario = siguiente.usuario
    ya_tiene = Prestamo.objects.filter(
        usuario=usuario, estado__in=ESTADOS_PENDIENTES, ejemplar_fisico__ficha_recurso=ficha,
    ).exists()
    if not usuario.is_active or usuario.esta_suspendido() or ya_tiene:
        siguiente.estado = EstadoCola.CANCELADO
        siguiente.save(update_fields=['estado'])
        return atender_cola(ficha)
    ejemplar = ejemplares_prestables(ficha).select_for_update(skip_locked=True).first()
    if ejemplar is None:
        return
    prestamo = Prestamo.objects.create(usuario=usuario, ejemplar_fisico=ejemplar, estado=EstadoPrestamo.RESERVADO)
    ejemplar.estado = EstadoEjemplar.RESERVADO
    ejemplar.save(update_fields=['estado'])
    siguiente.estado = EstadoCola.ATENDIDO
    siguiente.save(update_fields=['estado'])
    _avisar_recurso_disponible(prestamo)
    return prestamo


def registrar_prestamo(usuario, ficha, ejemplar=None, registrado_por=None):
    actualizar_estados()
    with transaction.atomic():
        get_user_model().objects.select_for_update().get(pk=usuario.pk)
        validar_puede_prestar(usuario, ficha)

        disponibles = ejemplares_prestables(ficha)
        if ejemplar is not None:
            elegido = disponibles.filter(pk=ejemplar.pk).select_for_update(of=('self',)).first()
            if elegido is None:
                raise ValidationError({'codigo_inventario': (
                    f'El ejemplar {ejemplar.codigo_inventario} no esta disponible '
                    f'({ejemplar.get_estado_display().lower()}).'
                )})
        else:
            elegido = disponibles.select_for_update(of=('self',), skip_locked=True).first()
            if elegido is None:
                raise ValidationError('No hay ejemplares disponibles de este recurso.')

        if registrado_por is None:
            prestamo = Prestamo.objects.create(usuario=usuario, ejemplar_fisico=elegido, estado=EstadoPrestamo.RESERVADO)
            elegido.estado = EstadoEjemplar.RESERVADO
        else:
            prestamo = Prestamo.objects.create(
                usuario=usuario,
                ejemplar_fisico=elegido,
                estado=EstadoPrestamo.ACTIVO,
                fecha_entrega=timezone.now(),
                fecha_limite=calcular_fecha_limite(usuario),
                condicion_entrega=elegido.condicion,
                registrado_por=registrado_por,
            )
            elegido.estado = EstadoEjemplar.PRESTADO
        elegido.save(update_fields=['estado'])
        return prestamo


def entregar_prestamo(pk, admin):
    actualizar_estados()
    with transaction.atomic():
        prestamo = _bloquear(Prestamo.objects.select_related('usuario', 'ejemplar_fisico__ficha_recurso'), pk)
        if prestamo.estado != EstadoPrestamo.RESERVADO:
            raise ValidationError(f'Solo se entrega una reserva pendiente (este prestamo esta {prestamo.get_estado_display().lower()}).')

        if not prestamo.usuario.is_active:
            raise ValidationError('El usuario ya no esta activo.')
        if prestamo.ejemplar_fisico.ficha_recurso.estado_ficha != EstadoFicha.ACTIVA:
            raise ValidationError('El recurso fue dado de baja del catalogo; la reserva ya no se puede entregar.')
        if Prestamo.objects.filter(usuario=prestamo.usuario, estado=EstadoPrestamo.VENCIDO).exists():
            raise ValidationError('El usuario tiene prestamos vencidos. Debe devolverlos antes de recoger otro.')

        prestamo.estado = EstadoPrestamo.ACTIVO
        prestamo.fecha_entrega = timezone.now()
        prestamo.fecha_limite = calcular_fecha_limite(prestamo.usuario)
        prestamo.registrado_por = admin
        ejemplar = _bloquear_ejemplar(prestamo)
        prestamo.condicion_entrega = ejemplar.condicion
        prestamo.save(update_fields=['estado', 'fecha_entrega', 'fecha_limite', 'condicion_entrega', 'registrado_por'])

        ejemplar.estado = EstadoEjemplar.PRESTADO
        ejemplar.save(update_fields=['estado'])
        return prestamo


def _bloquear(prestamos, pk):
    return get_object_or_404(prestamos.select_for_update(of=('self',)), pk=pk)


def _bloquear_ejemplar(prestamo):
    return EjemplarFisico.objects.select_for_update().get(pk=prestamo.ejemplar_fisico_id)


def _validar_entregado(prestamo):
    if prestamo.estado == EstadoPrestamo.RESERVADO:
        raise ValidationError('Esta reserva todavia no se entrego; no hay nada que devolver.')
    if prestamo.estado not in ESTADOS_ENTREGADOS:
        raise ValidationError(f'Este prestamo ya esta cerrado ({prestamo.get_estado_display().lower()}).')


@transaction.atomic
def registrar_devolucion(pk, condicion, observaciones=''):
    prestamo = _bloquear(Prestamo.objects.all(), pk)
    _validar_entregado(prestamo)

    ejemplar = _bloquear_ejemplar(prestamo)
    ejemplar.condicion = condicion

    prestamo.estado = EstadoPrestamo.DEVUELTO
    prestamo.fecha_devolucion = hoy()
    prestamo.condicion_devolucion = ejemplar.condicion
    prestamo.observaciones = observaciones
    prestamo.save(update_fields=['estado', 'fecha_devolucion', 'condicion_devolucion', 'observaciones'])

    dias_retraso = dias_habiles_entre(prestamo.fecha_limite, prestamo.fecha_devolucion)
    if dias_retraso > 0:
        politica = politica_de(prestamo.usuario)
        factor = politica.dias_suspension_por_dia_retraso if politica else FACTOR_SUSPENSION_POR_DEFECTO
        aplicar_suspension(prestamo.usuario, dias_retraso * factor)

    ejemplar.estado = estado_tras_devolucion(ejemplar.condicion)
    ejemplar.save(update_fields=['condicion', 'estado'])
    if ejemplar.estado == EstadoEjemplar.DISPONIBLE:
        atender_cola(prestamo.ejemplar_fisico.ficha_recurso)
    return prestamo


@transaction.atomic
def marcar_perdido(pk, observaciones=''):
    prestamo = _bloquear(Prestamo.objects.all(), pk)
    _validar_entregado(prestamo)

    prestamo.estado = EstadoPrestamo.PERDIDO
    prestamo.observaciones = observaciones
    prestamo.save(update_fields=['estado', 'observaciones'])

    politica = politica_de(prestamo.usuario)
    dias = politica.dias_suspension_por_perdida if politica else DIAS_SUSPENSION_PERDIDA_POR_DEFECTO
    aplicar_suspension(prestamo.usuario, dias)

    ejemplar = _bloquear_ejemplar(prestamo)
    ejemplar.estado = EstadoEjemplar.DADO_DE_BAJA
    ejemplar.save(update_fields=['estado'])
    return prestamo


@transaction.atomic
def cancelar_prestamo(pk, usuario=None):
    prestamos = Prestamo.objects.all() if usuario is None else Prestamo.objects.filter(usuario=usuario)
    prestamo = _bloquear(prestamos, pk)
    if prestamo.estado in ESTADOS_ENTREGADOS:
        if usuario is None:
            raise ValidationError('El recurso ya fue recogido; no se cancela, se registra su devolucion.')
        raise ValidationError('Ya recogiste este recurso; ahora debes devolverlo en el mostrador.')
    if prestamo.estado != EstadoPrestamo.RESERVADO:
        raise ValidationError(f'Este prestamo ya esta cerrado ({prestamo.get_estado_display().lower()}).')

    prestamo.estado = EstadoPrestamo.CANCELADO
    prestamo.save(update_fields=['estado'])

    ejemplar = _bloquear_ejemplar(prestamo)
    ejemplar.estado = estado_tras_devolucion(ejemplar.condicion)
    ejemplar.save(update_fields=['estado'])
    if ejemplar.estado == EstadoEjemplar.DISPONIBLE:
        atender_cola(prestamo.ejemplar_fisico.ficha_recurso)
    return prestamo


def renovar_prestamo(pk):
    marcar_vencidos()
    with transaction.atomic():
        prestamo = _bloquear(Prestamo.objects.select_related('usuario', 'ejemplar_fisico__ficha_recurso'), pk)
        if prestamo.estado != EstadoPrestamo.ACTIVO:
            raise ValidationError('Solo se puede renovar un prestamo activo (no vencido).')
        if prestamo.renovaciones >= MAX_RENOVACIONES:
            raise ValidationError(f'Este prestamo ya se renovo el maximo de {MAX_RENOVACIONES} vez/veces.')
        if prestamo.ejemplar_fisico.ficha_recurso.estado_ficha != EstadoFicha.ACTIVA:
            raise ValidationError('El recurso fue dado de baja del catalogo; debe devolverse.')

        nueva = calcular_fecha_limite(prestamo.usuario)
        if nueva <= prestamo.fecha_limite:
            raise ValidationError('Todavia es muy pronto para renovar: el plazo no se extenderia.')

        prestamo.fecha_limite = nueva
        prestamo.renovaciones += 1
        prestamo.save(update_fields=['fecha_limite', 'renovaciones'])
        return prestamo
