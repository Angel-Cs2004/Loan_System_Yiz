from django.urls import path

from .views import (
    CategoriaAdminDetailView,
    CategoriaAdminListCreateView,
    CategoriaListView,
    EjemplarAdminDetailView,
    EjemplarAdminListCreateView,
    RecursoAdminDetailView,
    RecursoAdminListCreateView,
    RecursoBajaView,
    RecursoDetailView,
    RecursoListView,
    RecursoReactivarView,
)

urlpatterns = [
    path('recursos/', RecursoListView.as_view()),
    path('recursos/<uuid:pk>/', RecursoDetailView.as_view()),
    path('categorias/', CategoriaListView.as_view()),

    path('admin/recursos/', RecursoAdminListCreateView.as_view()),
    path('admin/recursos/<uuid:pk>/', RecursoAdminDetailView.as_view()),
    path('admin/recursos/<uuid:pk>/baja/', RecursoBajaView.as_view()),
    path('admin/recursos/<uuid:pk>/reactivar/', RecursoReactivarView.as_view()),
    path('admin/recursos/<uuid:ficha_id>/ejemplares/', EjemplarAdminListCreateView.as_view()),
    path('admin/ejemplares/<uuid:pk>/', EjemplarAdminDetailView.as_view()),
    path('admin/categorias/', CategoriaAdminListCreateView.as_view()),
    path('admin/categorias/<uuid:pk>/', CategoriaAdminDetailView.as_view()),
]
