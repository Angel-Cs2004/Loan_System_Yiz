import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prestamos_sistema.settings')

app = Celery('prestamos_sistema')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
