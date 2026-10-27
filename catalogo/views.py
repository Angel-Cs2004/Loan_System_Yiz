import uuid

from django.db.models import ProtectedError, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import EsAdministrador

from .models import Categoria, EjemplarFisico, EstadoFicha, FichaRecurso
from .serializers import CategoriaSerializer, EjemplarFisicoSerializer, FichaRecursoAdminSerializer, FichaRecursoSerializer
from .services import Conflicto, dar_de_baja_ficha, reactivar_ficha

FILTROS_CATALOGO = [
    OpenApiParameter('q', str, description='Busca en nombre y descripcion'),
    OpenApiParameter('categoria', str, description='UUID de la categoria'),
    OpenApiParameter('solo_disponibles', bool, description='true para ver solo recursos con unidades libres'),
]


def filtrar_catalogo(queryset, params):
    q = params.get('q')
    if q:
        queryset = queryset.filter(Q(nombre__icontains=q) | Q(descripcion__icontains=q))

    categoria = params.get('categoria')
    if categoria:
        try:
            categoria = uuid.UUID(categoria)
        except ValueError:
            raise ValidationError({'categoria': 'Debe ser un UUID valido.'})
        queryset = queryset.filter(categoria_id=categoria)

    if params.get('solo_disponibles') in ('true', '1'):
        queryset = queryset.filter(disponibles__gt=0)
    return queryset


class ProtegerHistorialMixin:
    mensaje_protegido = ''

    def perform_destroy(self, instancia):
        try:
            instancia.delete()
        except ProtectedError:
            raise Conflicto(self.mensaje_protegido)


class RecursoListView(generics.ListAPIView):
    serializer_class = FichaRecursoSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(parameters=FILTROS_CATALOGO)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = (
            FichaRecurso.objects.filter(estado_ficha=EstadoFicha.ACTIVA)
            .select_related('categoria').con_disponibilidad().order_by('nombre')
        )
        return filtrar_catalogo(queryset, self.request.query_params)


class RecursoDetailView(generics.RetrieveAPIView):
    serializer_class = FichaRecursoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FichaRecurso.objects.filter(estado_ficha=EstadoFicha.ACTIVA).select_related('categoria').con_disponibilidad()


class CategoriaListView(generics.ListAPIView):
    queryset = Categoria.objects.order_by('nombre')
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]


class RecursoAdminListCreateView(generics.ListCreateAPIView):
    serializer_class = FichaRecursoAdminSerializer
    permission_classes = [EsAdministrador]

    @extend_schema(parameters=FILTROS_CATALOGO + [
        OpenApiParameter('estado_ficha', str, description='ACTIVA o DADA_DE_BAJA'),
    ])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = (
            FichaRecurso.objects.select_related('categoria')
            .prefetch_related('ejemplares').con_disponibilidad().order_by('nombre')
        )
        estado_ficha = self.request.query_params.get('estado_ficha')
        if estado_ficha:
            queryset = queryset.filter(estado_ficha=estado_ficha)
        return filtrar_catalogo(queryset, self.request.query_params)


class RecursoAdminDetailView(ProtegerHistorialMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FichaRecursoAdminSerializer
    permission_classes = [EsAdministrador]
    http_method_names = ['get', 'patch', 'delete']
    mensaje_protegido = 'El recurso tiene historial de prestamos y no se puede eliminar. Dalo de baja en su lugar.'

    def get_queryset(self):
        return FichaRecurso.objects.select_related('categoria').prefetch_related('ejemplares').con_disponibilidad()


class RecursoBajaView(APIView):
    permission_classes = [EsAdministrador]

    @extend_schema(request=None, responses=FichaRecursoAdminSerializer)
    def post(self, request, pk):
        ficha = dar_de_baja_ficha(get_object_or_404(FichaRecurso, pk=pk))
        return Response(FichaRecursoAdminSerializer(ficha).data)


class RecursoReactivarView(APIView):
    permission_classes = [EsAdministrador]

    @extend_schema(request=None, responses=FichaRecursoAdminSerializer)
    def post(self, request, pk):
        ficha = reactivar_ficha(get_object_or_404(FichaRecurso, pk=pk))
        return Response(FichaRecursoAdminSerializer(ficha).data)


class EjemplarAdminListCreateView(generics.ListCreateAPIView):
    serializer_class = EjemplarFisicoSerializer
    permission_classes = [EsAdministrador]

    def get_ficha(self):
        if not hasattr(self, '_ficha'):
            self._ficha = get_object_or_404(FichaRecurso, pk=self.kwargs['ficha_id'])
        return self._ficha

    def get_queryset(self):
        return EjemplarFisico.objects.filter(ficha_recurso=self.get_ficha()).order_by('codigo_inventario')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if 'ficha_id' in self.kwargs:
            context['ficha'] = self.get_ficha()
        return context

    def perform_create(self, serializer):
        serializer.save(ficha_recurso=self.get_ficha())


class EjemplarAdminDetailView(ProtegerHistorialMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = EjemplarFisico.objects.all()
    serializer_class = EjemplarFisicoSerializer
    permission_classes = [EsAdministrador]
    http_method_names = ['get', 'patch', 'delete']
    mensaje_protegido = 'El ejemplar tiene historial de prestamos y no se puede eliminar. Cambia su estado a DADO_DE_BAJA.'


class CategoriaAdminListCreateView(generics.ListCreateAPIView):
    queryset = Categoria.objects.order_by('nombre')
    serializer_class = CategoriaSerializer
    permission_classes = [EsAdministrador]


class CategoriaAdminDetailView(ProtegerHistorialMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [EsAdministrador]
    http_method_names = ['get', 'patch', 'delete']
    mensaje_protegido = 'La categoria tiene recursos asociados. Muevelos a otra categoria antes de eliminarla.'
