from celery import shared_task

from .services import actualizar_estados


@shared_task(name='prestamos.actualizar_estados')
def actualizar_estados_task():
    """Pasa a VENCIDO los prestamos atrasados y cancela las reservas no recogidas a tiempo.

    Se ejecuta periodicamente desde Celery Beat (ver CELERY_BEAT_SCHEDULE en settings),
    para que el estado del sistema no dependa de que alguien consulte un listado.
    """
    vencidos, caducadas = actualizar_estados()
    return {'vencidos': vencidos, 'reservas_caducadas': caducadas}
