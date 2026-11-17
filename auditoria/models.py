from django.conf import settings
from django.db import models


class AccionAuditoria(models.TextChoices):
    USUARIO_CAMBIO_ESTADO = 'USUARIO_CAMBIO_ESTADO', 'Cambió el estado de un usuario'
    USUARIO_CAMBIO_ROL = 'USUARIO_CAMBIO_ROL', 'Cambió el rol de un usuario'
    USUARIO_SUSPENSION = 'USUARIO_SUSPENSION', 'Modificó la suspensión de un usuario'
    USUARIO_BAJA = 'USUARIO_BAJA', 'Dio de baja a un usuario'
    RECURSO_BAJA = 'RECURSO_BAJA', 'Dio de baja un recurso'
    RECURSO_REACTIVADO = 'RECURSO_REACTIVADO', 'Reactivó un recurso'
    RECURSO_ELIMINADO = 'RECURSO_ELIMINADO', 'Eliminó un recurso'
    CATEGORIA_ELIMINADA = 'CATEGORIA_ELIMINADA', 'Eliminó una categoría'
    EJEMPLAR_ELIMINADO = 'EJEMPLAR_ELIMINADO', 'Eliminó un ejemplar'
    POLITICA_EDITADA = 'POLITICA_EDITADA', 'Editó una política de préstamo'
    PRESTAMO_PERDIDO = 'PRESTAMO_PERDIDO', 'Marcó un préstamo como perdido'
    PRESTAMO_CANCELADO = 'PRESTAMO_CANCELADO', 'Canceló un préstamo'


class RegistroAuditoria(models.Model):
    fecha = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='acciones_auditoria',
    )
    accion = models.CharField(max_length=40, choices=AccionAuditoria.choices)
    objeto = models.CharField(max_length=255)
    detalle = models.TextField(blank=True)

    class Meta:
        db_table = 'auditoria'
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.fecha:%Y-%m-%d %H:%M} {self.actor_id} {self.accion}'
