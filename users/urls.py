from django.urls import path
from .views import (
    CambiarPasswordView,
    LogoutView,
    PerfilView,
    RegistroUsuarioView,
    RestablecerPasswordView,
    SolicitarRestablecimientoView,
    UsuarioAdminDetailView,
    UsuarioAdminListCreateView,
)

urlpatterns = [
    path('registro/', RegistroUsuarioView.as_view(), name='registro-usuario'),
    path('logout/', LogoutView.as_view(), name='logout-usuario'),
    path('perfil/', PerfilView.as_view(), name = 'perfil'),
    path('perfil/password/', CambiarPasswordView.as_view(), name = 'cambiar_password'),
    path('password/olvide/', SolicitarRestablecimientoView.as_view(), name='password_olvide'),
    path('password/restablecer/', RestablecerPasswordView.as_view(), name='password_restablecer'),
    path('admin/usuarios/', UsuarioAdminListCreateView.as_view(), name = 'admin_user'),
    path('admin/usuarios/<int:pk>/', UsuarioAdminDetailView.as_view(), name = 'admin_user_detail')

]
