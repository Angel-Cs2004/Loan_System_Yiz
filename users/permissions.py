from rest_framework.permissions import BasePermission

from .models import TipoUsuario


class EsAdministrador(BasePermission):
    def has_permission(self, request, view):
        if(request.user and request.user.is_authenticated and request.user.tipo_usuario == TipoUsuario.ADMINISTRATOR):
           return True
        return False

