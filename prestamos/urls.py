from django.urls import path

from .views import (
    CategoriaAdminDetailView,
    CategoriaAdminListCreateView,
    EjemplarFisicoAdminDetailView,
    EjemplarFisicoAdminListCreateView,
    FichaRecursoAdminDetailView,
    FichaRecursoAdminListCreateView,
    FichaRecursoListView,
    MisPrestamosView,
    PoliticaPrestamoAdminDetailView,
    PoliticaPrestamoAdminListCreateView,
    PrestamoCreateView,
    PrestamoDetailView,
    PrestamoDevolucionView,
    PrestamoListView,
)

urlpatterns = [
    path('recursos/', FichaRecursoListView.as_view()),
    path('admin/recursos/', FichaRecursoAdminListCreateView.as_view()),
    path('admin/recursos/<uuid:pk>/', FichaRecursoAdminDetailView.as_view()),
    path('admin/recursos/<uuid:ficha_id>/ejemplares/', EjemplarFisicoAdminListCreateView.as_view()),
    path('admin/ejemplares/<uuid:pk>/', EjemplarFisicoAdminDetailView.as_view()),

    path('admin/categorias/', CategoriaAdminListCreateView.as_view()),
    path('admin/categorias/<uuid:pk>/', CategoriaAdminDetailView.as_view()),

    path('admin/politicas/', PoliticaPrestamoAdminListCreateView.as_view()),
    path('admin/politicas/<uuid:pk>/', PoliticaPrestamoAdminDetailView.as_view()),

    path('reservar/', PrestamoCreateView.as_view()),
    path('mis-reservas/', MisPrestamosView.as_view()),
    path('admin/reservas/', PrestamoListView.as_view()),
    path('admin/reservas/<uuid:pk>/', PrestamoDetailView.as_view()),
    path('admin/reservas/<uuid:pk>/devolver/', PrestamoDevolucionView.as_view()),
]
