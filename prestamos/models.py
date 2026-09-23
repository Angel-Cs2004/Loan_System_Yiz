import uuid

from django.conf import settings
from django.db import models


class EstadoPrestamo(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    DEVUELTO = 'DEVUELTO', 'Devuelto'
    VENCIDO = 'VENCIDO', 'Vencido'


class Recurso(models.Model):
    
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    nombre = models.CharField(max_length = 150)
    descripcion = models.TextField(blank = True)
    disponible = models.BooleanField(default = True)
    def __str__(self):
        return self.nombre

    class Meta:
        db_table = 'recursos'


class Prestamo(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete = models.CASCADE, related_name = 'prestamos')
    recurso = models.ForeignKey(Recurso, on_delete = models.CASCADE, related_name = 'prestamos')
    fecha_prestamo = models.DateTimeField(auto_now_add=True)
    fecha_limite = models.DateField()
    fecha_devolucion =models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=EstadoPrestamo.choices, default=EstadoPrestamo.ACTIVO)
    
    class Meta:
        db_table = 'prestamos'
