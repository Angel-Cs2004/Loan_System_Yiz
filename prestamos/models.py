import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from catalogo.models import EjemplarFisico
from users.models import TipoUsuario


class EstadoPrestamo(models.TextChoices):
    RESERVADO = 'RESERVADO', 'Reservado'
    ACTIVO = 'ACTIVO', 'Activo'
    DEVUELTO = 'DEVUELTO', 'Devuelto'
    VENCIDO = 'VENCIDO', 'Vencido'
    PERDIDO = 'PERDIDO', 'Perdido'
    CANCELADO = 'CANCELADO', 'Cancelado'


ESTADOS_PENDIENTES = [EstadoPrestamo.RESERVADO, EstadoPrestamo.ACTIVO, EstadoPrestamo.VENCIDO]

ESTADOS_ENTREGADOS = [EstadoPrestamo.ACTIVO, EstadoPrestamo.VENCIDO]


class PoliticaPrestamo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo_usuario = models.CharField(max_length=25, unique=True, choices=TipoUsuario.choices)
    dias_maximo_prestamo = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    max_prestamos_simultaneos = models.PositiveIntegerField(default=3, validators=[MinValueValidator(1)])

    class Meta:
        db_table = 'politicas_prestamo'
        constraints = [
            models.CheckConstraint(condition=models.Q(dias_maximo_prestamo__gte=1), name='politica_dias_minimo_1'),
            models.CheckConstraint(condition=models.Q(max_prestamos_simultaneos__gte=1), name='politica_max_minimo_1'),
        ]

    def __str__(self):
        return f'{self.tipo_usuario}: {self.dias_maximo_prestamo} dias, max {self.max_prestamos_simultaneos}'


class Prestamo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='prestamos')
    ejemplar_fisico = models.ForeignKey(EjemplarFisico, on_delete=models.PROTECT, related_name='prestamos')
    fecha_prestamo = models.DateTimeField(auto_now_add=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    fecha_limite = models.DateField(null=True, blank=True)
    fecha_devolucion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=EstadoPrestamo.choices, default=EstadoPrestamo.RESERVADO)
    renovaciones = models.PositiveSmallIntegerField(default=0)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='prestamos_registrados',
        null=True, blank=True,
    )

    class Meta:
        db_table = 'prestamos'
        ordering = ['-fecha_prestamo']
        constraints = [
            models.UniqueConstraint(
                fields=['ejemplar_fisico'],
                condition=models.Q(estado__in=ESTADOS_PENDIENTES),
                name='unico_prestamo_pendiente_por_ejemplar',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(estado=EstadoPrestamo.DEVUELTO, fecha_devolucion__isnull=False)
                    | (~models.Q(estado=EstadoPrestamo.DEVUELTO) & models.Q(fecha_devolucion__isnull=True))
                ),
                name='prestamo_devuelto_con_fecha',
            ),
            models.CheckConstraint(
                condition=(
                    ~models.Q(estado=EstadoPrestamo.RESERVADO)
                    | models.Q(fecha_entrega__isnull=True, fecha_limite__isnull=True)
                ),
                name='prestamo_reservado_sin_entrega',
            ),
            models.CheckConstraint(
                condition=(
                    ~models.Q(estado__in=[EstadoPrestamo.ACTIVO, EstadoPrestamo.VENCIDO,
                                          EstadoPrestamo.DEVUELTO, EstadoPrestamo.PERDIDO])
                    | models.Q(fecha_entrega__isnull=False, fecha_limite__isnull=False)
                ),
                name='prestamo_entregado_con_fechas',
            ),
        ]

    def __str__(self):
        return f'{self.usuario} - {self.estado}'
