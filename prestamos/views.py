from datetime import date

from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalogo.models import EstadoEjemplar
from catalogo.services import ejemplares_prestables, estado_tras_devolucion
from users.permissions import EsAdministrador

from .models import EstadoPrestamo, PoliticaPrestamo, Prestamo
from .serializers import (
    DevolucionSerializer,
    PoliticaPrestamoSerializer,
    PrestamoCreateSerializer,
    PrestamoSerializer,
)
from .services import calcular_fecha_limite


class PoliticaPrestamoAdminListCreateView(generics.ListCreateAPIView):
    queryset = PoliticaPrestamo.objects.all()
    serializer_class = PoliticaPrestamoSerializer
    permission_classes = [EsAdministrador]


class PoliticaPrestamoAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PoliticaPrestamo.objects.all()
    serializer_class = PoliticaPrestamoSerializer
    permission_classes = [EsAdministrador]


class PrestamoCreateView(generics.CreateAPIView):
    serializer_class = PrestamoCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        ficha = serializer.validated_data.pop('ficha_recurso')
        with transaction.atomic():
            ejemplar = ejemplares_prestables(ficha).select_for_update(of=('self',)).first()
            if ejemplar is None:
                raise ValidationError('No hay ejemplares disponibles de este recurso.')

            prestamo = serializer.save(
                usuario=self.request.user,
                ejemplar_fisico=ejemplar,
                fecha_limite=calcular_fecha_limite(self.request.user),
            )
            ejemplar.estado = EstadoEjemplar.PRESTADO
            ejemplar.save(update_fields=['estado'])
            return prestamo


class MisPrestamosView(generics.ListAPIView):
    serializer_class = PrestamoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prestamo.objects.filter(usuario=self.request.user)


class PrestamoListView(generics.ListAPIView):
    serializer_class = PrestamoSerializer
    permission_classes = [EsAdministrador]

    def get_queryset(self):
        queryset = Prestamo.objects.all()
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset


class PrestamoDetailView(generics.RetrieveDestroyAPIView):
    queryset = Prestamo.objects.all()
    serializer_class = PrestamoSerializer
    permission_classes = [EsAdministrador]

    def perform_destroy(self, prestamo):
        if prestamo.estado != EstadoPrestamo.DEVUELTO:
            raise ValidationError('Solo se pueden eliminar prestamos devueltos. Registra la devolucion primero.')
        prestamo.delete()


class PrestamoDevolucionView(APIView):
    permission_classes = [EsAdministrador]

    @extend_schema(request=DevolucionSerializer, responses=PrestamoSerializer)
    def post(self, request, pk):
        serializer = DevolucionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        condicion = serializer.validated_data.get('condicion')

        with transaction.atomic():
            prestamo = get_object_or_404(Prestamo.objects.select_for_update(), pk=pk)
            if prestamo.estado == EstadoPrestamo.DEVUELTO:
                raise ValidationError('Este prestamo ya fue devuelto.')

            prestamo.estado = EstadoPrestamo.DEVUELTO
            prestamo.fecha_devolucion = date.today()
            prestamo.save(update_fields=['estado', 'fecha_devolucion'])

            ejemplar = prestamo.ejemplar_fisico
            if condicion:
                ejemplar.condicion = condicion
            ejemplar.estado = estado_tras_devolucion(ejemplar.condicion)
            ejemplar.save(update_fields=['condicion', 'estado'])

        return Response(PrestamoSerializer(prestamo).data)
