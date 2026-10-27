import uuid

from django.conf import settings
from django.db import models

from catalogo.models import EjemplarFisico


class EstadoPrestamo(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    DEVUELTO = 'DEVUELTO', 'Devuelto'
    VENCIDO = 'VENCIDO', 'Vencido'


class PoliticaPrestamo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo_usuario = models.CharField(max_length=25, unique=True)
    dias_maximo_prestamo = models.PositiveIntegerField()

    class Meta:
        db_table = 'politicas_prestamo'

    def __str__(self):
        return f'{self.tipo_usuario}: {self.dias_maximo_prestamo} dias'


class Prestamo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='prestamos')
    ejemplar_fisico = models.ForeignKey(EjemplarFisico, on_delete=models.PROTECT, related_name='prestamos')
    fecha_prestamo = models.DateTimeField(auto_now_add=True)
    fecha_limite = models.DateField()
    fecha_devolucion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=EstadoPrestamo.choices, default=EstadoPrestamo.ACTIVO)

    class Meta:
        db_table = 'prestamos'
        constraints = [
            models.UniqueConstraint(
                fields=['ejemplar_fisico'],
                condition=models.Q(estado='ACTIVO'),
                name='unico_prestamo_activo_por_ejemplar',
            ),
        ]

    def __str__(self):
        return f'{self.usuario} - {self.estado}'
