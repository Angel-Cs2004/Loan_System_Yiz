from django.urls import path

from .views import (
    MisPrestamosView,
    PrestamoCreateView,
    PrestamoDetailView,
    PrestamoDevolucionView,
    PrestamoListView,
    RecursoAdminDetailView,
    RecursoAdminListCreateView,
    RecursoListView,
)

# OJO PA MI WAA: aqui el id es UUID, asi que el conversor es <uuid:pk>, no <int:pk>
# (en users si era int porque Usuario usa id entero).
urlpatterns = [
    path('recursos/',RecursoListView.as_view()),
    path('admin/recursos/',RecursoAdminListCreateView.as_view()),
    path('admin/recursos/<uuid:pk>/',RecursoAdminDetailView.as_view()),
    path('reservar/', PrestamoCreateView.as_view()),
    path('mis-reservas/', MisPrestamosView.as_view()),
    path('admin/reservas/', PrestamoListView.as_view()),
    path('admin/reservas/<uuid:pk>/', PrestamoDetailView.as_view()),
    path('admin/reservas/<uuid:pk>/devolver/', PrestamoDevolucionView.as_view()),

]
