from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.core.validators import RegexValidator

validar_8_digitos = RegexValidator(r'^\d{8}$', 'Debe tener exactamente 8 digitos.')


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = email.strip().lower()
        usuario = self.model(email=email, **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('tipo_usuario', TipoUsuario.ADMINISTRATOR)
        return self.create_user(email, password, **extra_fields)
class TipoUsuario(models.TextChoices):
    TEACHER = 'TEACHER', 'Profesor'
    STUDENT = 'STUDENT', 'Estudiante'
    ADMINISTRATIVE_STAFF = 'ADMINISTRATIVE_STAFF', 'Personal administrativo'
    ADMINISTRATOR = 'ADMINISTRATOR', 'Administrador'

class EstadoUsuario(models.TextChoices):
    ACTIVO = 'ACTIVO', 'Activo'
    INACTIVO = 'INACTIVO', 'Inactivo'
    SUSPENDIDO = 'SUSPENDIDO', 'Suspendido'

class Usuario(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    dni = models.CharField(max_length=8, unique=True, validators=[validar_8_digitos])
    cui = models.CharField(max_length=8, unique=True, null=True, blank=True, validators=[validar_8_digitos])
    tipo_usuario = models.CharField(max_length=25, choices=TipoUsuario.choices)
    status = models.CharField(max_length=20, choices=EstadoUsuario.choices, default=EstadoUsuario.ACTIVO)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['dni']
    class Meta:
        db_table = 'users'

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        self.is_active = self.status == EstadoUsuario.ACTIVO
        update_fields = kwargs.get('update_fields')
        if update_fields is not None and 'status' in update_fields:
            kwargs['update_fields'] = {*update_fields, 'is_active'}
        super().save(*args, **kwargs)

    def get_max_loan_period(self):
        from prestamos.models import PoliticaPrestamo
        politica = PoliticaPrestamo.objects.filter(tipo_usuario=self.tipo_usuario).first()
        return politica.dias_maximo_prestamo if politica else None

    objects = UsuarioManager()
