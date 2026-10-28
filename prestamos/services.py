from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from catalogo.models import CondicionEjemplar, EjemplarFisico, EstadoEjemplar, EstadoFicha
from catalogo.services import ejemplares_prestables, estado_tras_devolucion

from .models import ESTADOS_ENTREGADOS, ESTADOS_PENDIENTES, EstadoPrestamo, PoliticaPrestamo, Prestamo


DIAS_POR_DEFECTO = 7
MAX_PRESTAMOS_POR_DEFECTO = 3

MAX_RENOVACIONES = 1

HORAS_PARA_RECOGER = 24


def hoy():
    return timezone.localdate()


def politica_de(usuario):
    return PoliticaPrestamo.objects.filter(tipo_usuario=usuario.tipo_usuario).first()


def calcular_fecha_limite(usuario):
    dias = usuario.get_max_loan_period()
    if dias is None:
        dias = DIAS_POR_DEFECTO
    return hoy() + timedelta(days=dias)


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
        return total


def caducar_reservas():
    limite = timezone.now() - timedelta(hours=HORAS_PARA_RECOGER)
    return cancelar_reservas(Prestamo.objects.filter(fecha_prestamo__lt=limite))


def actualizar_estados():
    return marcar_vencidos(), caducar_reservas()


def validar_puede_prestar(usuario, ficha):
    pendientes = Prestamo.objects.filter(usuario=usuario, estado__in=ESTADOS_PENDIENTES)

    if pendientes.filter(estado=EstadoPrestamo.VENCIDO).exists():
        raise ValidationError('Tienes prestamos vencidos. Devuelvelos antes de pedir otro recurso.')

    if pendientes.filter(ejemplar_fisico__ficha_recurso=ficha).exists():
        raise ValidationError('Ya tienes un ejemplar de este recurso prestado o reservado.')

    politica = politica_de(usuario)
    maximo = politica.max_prestamos_simultaneos if politica else MAX_PRESTAMOS_POR_DEFECTO
    if pendientes.count() >= maximo:
        raise ValidationError(f'Alcanzaste el maximo de {maximo} prestamos simultaneos.')


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
        prestamo.save(update_fields=['estado', 'fecha_entrega', 'fecha_limite', 'registrado_por'])

        ejemplar = _bloquear_ejemplar(prestamo)
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
def registrar_devolucion(pk, condicion=None):
    prestamo = _bloquear(Prestamo.objects.all(), pk)
    _validar_entregado(prestamo)

    prestamo.estado = EstadoPrestamo.DEVUELTO
    prestamo.fecha_devolucion = hoy()
    prestamo.save(update_fields=['estado', 'fecha_devolucion'])

    ejemplar = _bloquear_ejemplar(prestamo)
    if condicion:
        ejemplar.condicion = condicion
    ejemplar.estado = estado_tras_devolucion(ejemplar.condicion)
    ejemplar.save(update_fields=['condicion', 'estado'])
    return prestamo


@transaction.atomic
def marcar_perdido(pk, observaciones=''):
    prestamo = _bloquear(Prestamo.objects.all(), pk)
    _validar_entregado(prestamo)

    prestamo.estado = EstadoPrestamo.PERDIDO
    prestamo.save(update_fields=['estado'])

    ejemplar = _bloquear_ejemplar(prestamo)
    ejemplar.estado = EstadoEjemplar.DADO_DE_BAJA
    nota = f'[{hoy():%d/%m/%Y}] Perdido en el prestamo de {prestamo.usuario.email}.'
    if observaciones:
        nota += f' {observaciones}'
    ejemplar.observaciones = f'{ejemplar.observaciones}\n{nota}'.strip()
    ejemplar.save(update_fields=['estado', 'observaciones'])
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
