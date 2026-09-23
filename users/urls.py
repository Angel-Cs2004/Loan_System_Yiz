from django.urls import path
from .views import RegistroUsuarioView, LogoutView, PerfilView, UsuarioAdminListCreateView, UsuarioAdminDetailView

urlpatterns = [
    path('registro/', RegistroUsuarioView.as_view(), name='registro-usuario'),
    path('logout/', LogoutView.as_view(), name='logout-usuario'),
    path('perfil/', PerfilView.as_view(), name = 'perfil'),
    path('admin/usuarios/', UsuarioAdminListCreateView.as_view(), name = 'admin_user'),
    path('admin/usuarios/<int:pk>/', UsuarioAdminDetailView.as_view(), name = 'admin_user_detail')

]
