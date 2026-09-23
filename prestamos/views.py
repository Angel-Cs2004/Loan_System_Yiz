from datetime import date

from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import EsAdministrador

from .models import EstadoPrestamo, Prestamo, Recurso
from .serializers import PrestamoCreateSerializer, PrestamoSerializer, RecursoSerializer
from .services import calcular_fecha_limite


class RecursoListView(generics.ListAPIView):
    queryset = Recurso.objects.filter(disponible = True)
    serializer_class = RecursoSerializer
    permission_classes = [IsAuthenticated]

class RecursoAdminListCreateView(generics.ListCreateAPIView):
    queryset = Recurso.objects.all() 
    serializer_class = RecursoSerializer
    permission_classes = [EsAdministrador]


class RecursoAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Recurso.objects.all() 
    serializer_class = RecursoSerializer
    permission_classes = [EsAdministrador]


class PrestamoCreateView(generics.CreateAPIView):
    serializer_class = PrestamoCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        recurso = serializer.validated_data['recurso']
        serializer.save(usuario=self.request.user,
                           fecha_limite=calcular_fecha_limite(self.request.user))
        recurso.disponible = False
        recurso.save()


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


class PrestamoDevolucionView(APIView):
    permission_classes = [EsAdministrador]
    def post(self, request, pk):
        prestamo = get_object_or_404(Prestamo, pk = pk)
        prestamo.estado =  EstadoPrestamo.DEVUELTO
        prestamo.fecha_devolucion = date.today()
        prestamo.save()
        prestamo.recurso.disponible = True
        prestamo.recurso.save()
        return Response(PrestamoSerializer(prestamo).data)

