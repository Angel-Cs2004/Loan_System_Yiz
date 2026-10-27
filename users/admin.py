from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import AdminUserCreationForm, UserChangeForm
from .models import Usuario


class UsuarioCreationForm(AdminUserCreationForm):
    class Meta:
        model = Usuario
        fields = ('email', 'dni', 'cui', 'tipo_usuario')


class UsuarioChangeForm(UserChangeForm):
    class Meta:
        model = Usuario
        fields = '__all__'


class UsuarioAdmin(UserAdmin):
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm
    ordering = ['email']
    list_display = ['email', 'dni', 'cui', 'tipo_usuario', 'status', 'is_staff']
    list_filter = ['tipo_usuario', 'status', 'is_staff']
    search_fields = ['email', 'dni', 'cui']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Datos personales', {'fields': ('first_name', 'last_name', 'dni', 'cui')}),
        ('Sistema', {'fields': ('tipo_usuario', 'status')}),
        ('Permisos', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'dni', 'cui', 'tipo_usuario', 'usable_password', 'password1', 'password2'),
        }),
    )

admin.site.register(Usuario, UsuarioAdmin)
