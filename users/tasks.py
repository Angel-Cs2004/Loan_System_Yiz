import logging

from celery import shared_task
from django.core.mail import send_mail

logger = logging.getLogger('users')


@shared_task(
    bind=True,
    name='users.enviar_correo',
    max_retries=3,
    default_retry_delay=60,  # segundos entre reintentos
)
def enviar_correo_task(self, subject, message, recipient_list):
    """Envia un correo en segundo plano, con reintentos si el SMTP falla.

    Se ejecuta en el worker de Celery, asi la peticion del usuario no espera al
    envio. Si el servidor de correo falla, reintenta; si se agotan los intentos,
    lo registra en el log en vez de perder el error en silencio.
    """
    try:
        send_mail(subject=subject, message=message, from_email=None, recipient_list=recipient_list)
    except Exception as exc:
        logger.warning('Fallo al enviar correo a %s: %s. Reintentando...', recipient_list, exc)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error('No se pudo enviar el correo a %s tras varios intentos: %s', recipient_list, exc)
