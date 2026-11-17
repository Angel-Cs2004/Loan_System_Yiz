from .models import RegistroAuditoria


def registrar(actor, accion, objeto, detalle=''):
    """Deja constancia de una accion sensible: quien la hizo, sobre que y cuando."""
    RegistroAuditoria.objects.create(actor=actor, accion=accion, objeto=str(objeto), detalle=detalle)
