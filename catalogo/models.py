import uuid

from django.db import models
from django.db.models import Count, Q
from django.db.models.functions import Lower


class EstadoEjemplar(models.TextChoices):
    DISPONIBLE = 'DISPONIBLE', 'Disponible'
    PRESTADO = 'PRESTADO', 'Prestado'
    RESERVADO = 'RESERVADO', 'Reservado'
    EN_MANTENIMIENTO = 'EN_MANTENIMIENTO', 'En mantenimiento'
    DADO_DE_BAJA = 'DADO_DE_BAJA', 'Dado de baja'


class CondicionEjemplar(models.TextChoices):
    BUENO = 'BUENO', 'Bueno'
    REGULAR = 'REGULAR', 'Regular'
    DANADO = 'DANADO', 'Danado'


class EstadoFicha(models.TextChoices):
    ACTIVA = 'ACTIVA', 'Activa'
    DADA_DE_BAJA = 'DADA_DE_BAJA', 'Dada de baja'


class Disponibilidad(models.TextChoices):
    DISPONIBLE = 'DISPONIBLE', 'Disponible'
    AGOTADO = 'AGOTADO', 'Agotado'
    SIN_EJEMPLARES = 'SIN_EJEMPLARES', 'Sin ejemplares'


class Categoria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100)

    class Meta:
        db_table = 'categorias'
        constraints = [
            models.UniqueConstraint(Lower('nombre'), name='categoria_nombre_unico'),
        ]

    def __str__(self):
        return self.nombre


class FichaRecursoQuerySet(models.QuerySet):
    def con_disponibilidad(self):
        return self.annotate(
            total_ejemplares=Count('ejemplares', filter=~Q(ejemplares__estado=EstadoEjemplar.DADO_DE_BAJA)),
            disponibles=Count('ejemplares', filter=Q(ejemplares__estado=EstadoEjemplar.DISPONIBLE)),
        )


class FichaRecurso(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    categoria = models.ForeignKey(
        Categoria, on_delete=models.PROTECT, related_name='fichas_recurso',
        null=True, blank=True,
    )
    estado_ficha = models.CharField(max_length=20, choices=EstadoFicha.choices, default=EstadoFicha.ACTIVA)

    objects = FichaRecursoQuerySet.as_manager()

    class Meta:
        db_table = 'fichas_recurso'
        constraints = [
            models.UniqueConstraint(
                Lower('nombre'), 'categoria',
                name='ficha_nombre_unico_por_categoria',
                nulls_distinct=False,
            ),
        ]

    def __str__(self):
        return self.nombre

    @staticmethod
    def calcular_disponibilidad(total, disponibles):
        if total == 0:
            return Disponibilidad.SIN_EJEMPLARES
        if disponibles > 0:
            return Disponibilidad.DISPONIBLE
        return Disponibilidad.AGOTADO


class EjemplarFisico(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ficha_recurso = models.ForeignKey(FichaRecurso, on_delete=models.CASCADE, related_name='ejemplares')
    codigo_inventario = models.CharField(max_length=50, unique=True)
    estado = models.CharField(max_length=20, choices=EstadoEjemplar.choices, default=EstadoEjemplar.DISPONIBLE)
    condicion = models.CharField(max_length=20, choices=CondicionEjemplar.choices, default=CondicionEjemplar.BUENO)
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'ejemplares_fisicos'
        constraints = [
            models.CheckConstraint(
                condition=~Q(condicion=CondicionEjemplar.DANADO, estado=EstadoEjemplar.DISPONIBLE),
                name='ejemplar_danado_no_disponible',
            ),
        ]

    def __str__(self):
        return f'{self.ficha_recurso.nombre} ({self.codigo_inventario})'
