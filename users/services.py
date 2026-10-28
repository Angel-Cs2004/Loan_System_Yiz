from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from prestamos.models import ESTADOS_ENTREGADOS
from prestamos.services import cancelar_reservas

from .models import EstadoUsuario, Usuario


def cerrar_sesiones(usuario):
    pendientes = OutstandingToken.objects.filter(user=usuario, blacklistedtoken__isnull=True)
    BlacklistedToken.objects.bulk_create([BlacklistedToken(token=t) for t in pendientes])


def validar_cambio_de_estado(usuario, nuevo_status):
    if nuevo_status == EstadoUsuario.INACTIVO and usuario.prestamos.filter(estado__in=ESTADOS_ENTREGADOS).exists():
        raise ValidationError({'status': 'El usuario tiene recursos sin devolver. Registra la devolucion primero.'})


def aplicar_cambio_de_estado(usuario, nuevo_status):
    with transaction.atomic():
        usuario.status = nuevo_status
        usuario.save(update_fields=['status'])
        if nuevo_status != EstadoUsuario.ACTIVO:
            cancelar_reservas(usuario.prestamos.all())
    return usuario


def enviar_enlace_restablecimiento(email):
    usuario = Usuario.objects.filter(email=email, is_active=True).first()
    if usuario is None:
        return
    uid = urlsafe_base64_encode(force_bytes(usuario.pk))
    token = default_token_generator.make_token(usuario)
    enlace = f'{settings.FRONTEND_URL}/restablecer-password?uid={uid}&token={token}'
    minutos = settings.PASSWORD_RESET_TIMEOUT // 60
    send_mail(
        subject='Restablecer tu contrasena - Sistema de Prestamos',
        message=(
            f'Hola {usuario.first_name or usuario.email},\n\n'
            f'Para crear una contrasena nueva entra a este enlace (vence en {minutos} minutos):\n'
            f'{enlace}\n\n'
            'Si no lo pediste, ignora este correo: tu contrasena sigue igual.'
        ),
        from_email=None,
        recipient_list=[usuario.email],
    )


def restablecer_password(usuario, password):
    usuario.set_password(password)
    usuario.save(update_fields=['password'])
    cerrar_sesiones(usuario)
