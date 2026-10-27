import uuid

from django.db import models


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


class FichaRecurso(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    categoria = models.ForeignKey(
        Categoria, on_delete=models.PROTECT, related_name='fichas_recurso',
        null=True, blank=True,
    )
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
