from datetime import date

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import EsAdministrador

from .models import Categoria, EjemplarFisico, EstadoEjemplar, EstadoPrestamo, FichaRecurso, PoliticaPrestamo, Prestamo
from .serializers import (
    CategoriaSerializer, EjemplarFisicoSerializer, FichaRecursoAdminSerializer,
    FichaRecursoSerializer, PoliticaPrestamoSerializer, PrestamoCreateSerializer,
    PrestamoSerializer,
)
from .services import calcular_fecha_limite


class CategoriaAdminListCreateView(generics.ListCreateAPIView):
    queryset = Categoria.objects.all().order_by('nombre')
    serializer_class = CategoriaSerializer
    permission_classes = [EsAdministrador]


class CategoriaAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [EsAdministrador]


class PoliticaPrestamoAdminListCreateView(generics.ListCreateAPIView):
    queryset = PoliticaPrestamo.objects.all().order_by('tipo_usuario')
    serializer_class = PoliticaPrestamoSerializer
    permission_classes = [EsAdministrador]


class PoliticaPrestamoAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PoliticaPrestamo.objects.all()
    serializer_class = PoliticaPrestamoSerializer
    permission_classes = [EsAdministrador]


class FichaRecursoListView(generics.ListAPIView):
    queryset = FichaRecurso.objects.filter(estado_ficha='ACTIVA')
    serializer_class = FichaRecursoSerializer
    permission_classes = [IsAuthenticated]


class FichaRecursoAdminListCreateView(generics.ListCreateAPIView):
    queryset = FichaRecurso.objects.all().prefetch_related('ejemplares')
    serializer_class = FichaRecursoAdminSerializer
    permission_classes = [EsAdministrador]


class FichaRecursoAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FichaRecurso.objects.all().prefetch_related('ejemplares')
    serializer_class = FichaRecursoAdminSerializer
    permission_classes = [EsAdministrador]


class EjemplarFisicoAdminListCreateView(generics.ListCreateAPIView):
    serializer_class = EjemplarFisicoSerializer
    permission_classes = [EsAdministrador]

    def get_queryset(self):
        return EjemplarFisico.objects.filter(ficha_recurso_id=self.kwargs['ficha_id'])

    def perform_create(self, serializer):
        ficha = get_object_or_404(FichaRecurso, pk=self.kwargs['ficha_id'])
        serializer.save(ficha_recurso=ficha)


class EjemplarFisicoAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EjemplarFisico.objects.all()
    serializer_class = EjemplarFisicoSerializer
    permission_classes = [EsAdministrador]


class PrestamoCreateView(generics.CreateAPIView):
    serializer_class = PrestamoCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        ficha = serializer.validated_data['ficha_recurso']
        with transaction.atomic():
            ejemplar = EjemplarFisico.objects.select_for_update().filter(
                ficha_recurso=ficha, estado=EstadoEjemplar.DISPONIBLE,
            ).first()
            if ejemplar is None:
                raise ValidationError('No hay ejemplares disponibles de este recurso.')
            serializer.save(
                usuario=self.request.user,
                ejemplar_fisico=ejemplar,
                fecha_limite=calcular_fecha_limite(self.request.user),
            )
            ejemplar.estado = EstadoEjemplar.PRESTADO
            ejemplar.save(update_fields=['estado'])


class MisPrestamosView(generics.ListAPIView):
    serializer_class = PrestamoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prestamo.objects.filter(usuario=self.request.user).select_related('ejemplar_fisico__ficha_recurso')


class PrestamoListView(generics.ListAPIView):
    serializer_class = PrestamoSerializer
    permission_classes = [EsAdministrador]

    def get_queryset(self):
        queryset = Prestamo.objects.all().select_related('usuario', 'ejemplar_fisico__ficha_recurso')
        estado = self.request.query_params.get('estado')
        return queryset.filter(estado=estado) if estado else queryset


class PrestamoDetailView(generics.RetrieveDestroyAPIView):
    queryset = Prestamo.objects.all()
    serializer_class = PrestamoSerializer
    permission_classes = [EsAdministrador]


class PrestamoDevolucionView(APIView):
    permission_classes = [EsAdministrador]

    def post(self, request, pk):
        prestamo = get_object_or_404(Prestamo.objects.select_related('ejemplar_fisico'), pk=pk)
        if prestamo.estado != EstadoPrestamo.ACTIVO:
            raise ValidationError('El préstamo no está activo.')
        prestamo.estado = EstadoPrestamo.DEVUELTO
        prestamo.fecha_devolucion = date.today()
        prestamo.save(update_fields=['estado', 'fecha_devolucion'])
        prestamo.ejemplar_fisico.estado = EstadoEjemplar.DISPONIBLE
        prestamo.ejemplar_fisico.save(update_fields=['estado'])
        return Response(PrestamoSerializer(prestamo).data)
