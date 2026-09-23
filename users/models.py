from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

# Create your models here.

#=======USER MANAGER PARA CAMBIOS EN LOGIN=======
class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        usuario = self.model(email=email, **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)
#================================================
#investigar textChoise [--]
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
    cui = models.CharField(max_length = 8, unique = True, blank = False, null = False)
    tipo_usuario = models.CharField(max_length=25, choices=TipoUsuario.choices)
    status = models.CharField(max_length=20, choices=EstadoUsuario.choices, default=EstadoUsuario.ACTIVO)

    USERNAME_FIELD = 'email' #USAR ESTE CAMPO PARA LOGIN (REPASAR) [--]
    REQUIRED_FIELDS = ['cui'] #CAMPOS QUE PIDE CREATE_SUPER_USER [--]
    class Meta:
        db_table = 'users'

    #Defino una función segun DDD
    def get_max_loan_period(self):
        from prestamos.services import DIAS_MAXIMOS_POR_TIPO
        return DIAS_MAXIMOS_POR_TIPO.get(self.tipo_usuario)

    objects = UsuarioManager()
