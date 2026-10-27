from rest_framework.exceptions import APIException, ValidationError

from .models import CondicionEjemplar, EjemplarFisico, EstadoEjemplar, EstadoFicha


ESTADOS_MANUALES = [EstadoEjemplar.DISPONIBLE, EstadoEjemplar.EN_MANTENIMIENTO, EstadoEjemplar.DADO_DE_BAJA]

ESTADOS_INICIALES = [EstadoEjemplar.DISPONIBLE, EstadoEjemplar.EN_MANTENIMIENTO]


class Conflicto(APIException):
    status_code = 409
    default_detail = 'La operacion entra en conflicto con el estado actual del recurso.'
    default_code = 'conflicto'


def ejemplares_prestables(ficha):
    return (
        EjemplarFisico.objects
        .filter(ficha_recurso=ficha, ficha_recurso__estado_ficha=EstadoFicha.ACTIVA, estado=EstadoEjemplar.DISPONIBLE)
        .order_by('codigo_inventario')
    )


def dar_de_baja_ficha(ficha):
    if ficha.estado_ficha == EstadoFicha.DADA_DE_BAJA:
        raise ValidationError('El recurso ya esta dado de baja.')
    ficha.estado_ficha = EstadoFicha.DADA_DE_BAJA
    ficha.save(update_fields=['estado_ficha'])
    return ficha


def reactivar_ficha(ficha):
    if ficha.estado_ficha == EstadoFicha.ACTIVA:
        raise ValidationError('El recurso ya esta activo.')
    ficha.estado_ficha = EstadoFicha.ACTIVA
    ficha.save(update_fields=['estado_ficha'])
    return ficha


def validar_estado_y_condicion(estado, condicion):
    if condicion == CondicionEjemplar.DANADO and estado == EstadoEjemplar.DISPONIBLE:
        raise ValidationError({'estado': 'Un ejemplar danado no puede quedar disponible.'})


def estado_tras_devolucion(condicion):
    if condicion == CondicionEjemplar.DANADO:
        return EstadoEjemplar.EN_MANTENIMIENTO
    return EstadoEjemplar.DISPONIBLE
