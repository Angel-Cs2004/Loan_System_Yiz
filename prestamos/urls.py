from django.urls import path

from .views import (
    ColaAdminListView,
    ColaListCreateView,
    ColaSalirView,
    FeriadoAdminDetailView,
    FeriadoAdminListCreateView,
    MiPrestamoCancelarView,
    MisPrestamosView,
    PoliticaPrestamoAdminDetailView,
    PoliticaPrestamoAdminListView,
    PrestamoCancelarAdminView,
    PrestamoCreateView,
    PrestamoDetailView,
    PrestamoDevolucionView,
    PrestamoEntregaView,
    PrestamoListView,
    PrestamoPerdidoView,
    PrestamoRenovarAdminView,
)

urlpatterns = [
    path('admin/politicas/', PoliticaPrestamoAdminListView.as_view()),
    path('admin/politicas/<uuid:pk>/', PoliticaPrestamoAdminDetailView.as_view()),

    path('admin/feriados/', FeriadoAdminListCreateView.as_view()),
    path('admin/feriados/<uuid:pk>/', FeriadoAdminDetailView.as_view()),

    path('reservar/', PrestamoCreateView.as_view()),
    path('mis-reservas/', MisPrestamosView.as_view()),
    path('mis-reservas/<uuid:pk>/cancelar/', MiPrestamoCancelarView.as_view()),

    path('cola/', ColaListCreateView.as_view()),
    path('cola/<uuid:pk>/', ColaSalirView.as_view()),
    path('admin/cola/', ColaAdminListView.as_view()),

    path('admin/reservas/', PrestamoListView.as_view()),
    path('admin/reservas/<uuid:pk>/', PrestamoDetailView.as_view()),
    path('admin/reservas/<uuid:pk>/entregar/', PrestamoEntregaView.as_view()),
    path('admin/reservas/<uuid:pk>/cancelar/', PrestamoCancelarAdminView.as_view()),
    path('admin/reservas/<uuid:pk>/devolver/', PrestamoDevolucionView.as_view()),
    path('admin/reservas/<uuid:pk>/perdido/', PrestamoPerdidoView.as_view()),
    path('admin/reservas/<uuid:pk>/renovar/', PrestamoRenovarAdminView.as_view()),
]
