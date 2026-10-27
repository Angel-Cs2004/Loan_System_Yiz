from django.urls import path

from .views import (
    MisPrestamosView,
    PoliticaPrestamoAdminDetailView,
    PoliticaPrestamoAdminListCreateView,
    PrestamoCreateView,
    PrestamoDetailView,
    PrestamoDevolucionView,
    PrestamoListView,
)

urlpatterns = [
    path('admin/politicas/', PoliticaPrestamoAdminListCreateView.as_view()),
    path('admin/politicas/<uuid:pk>/', PoliticaPrestamoAdminDetailView.as_view()),

    path('reservar/', PrestamoCreateView.as_view()),
    path('mis-reservas/', MisPrestamosView.as_view()),
    path('admin/reservas/', PrestamoListView.as_view()),
    path('admin/reservas/<uuid:pk>/', PrestamoDetailView.as_view()),
    path('admin/reservas/<uuid:pk>/devolver/', PrestamoDevolucionView.as_view()),
]
