import uuid

from django.conf import settings
from django.db import models


class EstadoPrestamo(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    DEVUELTO = 'DEVUELTO', 'Devuelto'
    VENCIDO = 'VENCIDO', 'Vencido'


class EstadoEjemplar(models.TextChoices):
    DISPONIBLE = 'DISPONIBLE', 'Disponible'
    PRESTADO = 'PRESTADO', 'Prestado'
    EN_MANTENIMIENTO = 'EN_MANTENIMIENTO', 'En mantenimiento'


class EstadoFicha(models.TextChoices):
    ACTIVA = 'ACTIVA', 'Activa'
    DADA_DE_BAJA = 'DADA_DE_BAJA', 'Dada de baja'


class Categoria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'categorias'

    def __str__(self):
        return self.nombre


class PoliticaPrestamo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo_usuario = models.CharField(max_length=25, unique=True)
    dias_maximo_prestamo = models.PositiveIntegerField()

    class Meta:
        db_table = 'politicas_prestamo'

    def __str__(self):
        return f'{self.tipo_usuario}: {self.dias_maximo_prestamo} dias'


class FichaRecurso(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name='fichas_recurso', null=True, blank=True)
    estado_ficha = models.CharField(max_length=20, choices=EstadoFicha.choices, default=EstadoFicha.ACTIVA)

    class Meta:
        db_table = 'fichas_recurso'

    def __str__(self):
        return self.nombre


class EjemplarFisico(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ficha_recurso = models.ForeignKey(FichaRecurso, on_delete=models.CASCADE, related_name='ejemplares')
    codigo_inventario = models.CharField(max_length=50, unique=True)
    estado = models.CharField(max_length=20, choices=EstadoEjemplar.choices, default=EstadoEjemplar.DISPONIBLE)
    condicion = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'ejemplares_fisicos'

    def __str__(self):
        return f'{self.ficha_recurso.nombre} ({self.codigo_inventario})'


class Prestamo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prestamos')
    ejemplar_fisico = models.ForeignKey(EjemplarFisico, on_delete=models.CASCADE, related_name='prestamos')
    fecha_prestamo = models.DateTimeField(auto_now_add=True)
    fecha_limite = models.DateField()
    fecha_devolucion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=EstadoPrestamo.choices, default=EstadoPrestamo.ACTIVO)

    class Meta:
        db_table = 'prestamos'
        constraints = [models.UniqueConstraint(fields=['ejemplar_fisico'], condition=models.Q(estado='ACTIVO'), name='unico_prestamo_activo_por_ejemplar')]

    def __str__(self):
        return f'{self.usuario} - {self.estado}'
