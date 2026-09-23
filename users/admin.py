from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


class UsuarioAdmin(UserAdmin):
    ordering = ['email']
    list_display = ['email', 'cui', 'tipo_usuario', 'status', 'is_staff']
    search_fields = ['email', 'cui']

admin.site.register(Usuario, UsuarioAdmin)

# RECORDAR : PERSONALIZAMOS "UserAdmin" YA QUE EL ORIGINAL 
#RESIVIA COMO LOGER A USERNAME