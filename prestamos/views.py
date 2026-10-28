import uuid

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import EsAdministrador

from .models import EstadoPrestamo, PoliticaPrestamo, Prestamo
from .serializers import (
    DevolucionSerializer,
    PerdidaSerializer,
    PoliticaPrestamoSerializer,
    PrestamoAdminCreateSerializer,
    PrestamoCreateSerializer,
    PrestamoSerializer,
)
from .services import (
    actualizar_estados,
    cancelar_prestamo,
    entregar_prestamo,
    marcar_perdido,
    registrar_devolucion,
    registrar_prestamo,
    renovar_prestamo,
)


def prestamos_con_detalle():
    return Prestamo.objects.select_related('usuario', 'registrado_por', 'ejemplar_fisico__ficha_recurso')


def responder(prestamo, codigo=status.HTTP_200_OK):
    return Response(PrestamoSerializer(prestamos_con_detalle().get(pk=prestamo.pk)).data, status=codigo)


class PoliticaPrestamoAdminListView(generics.ListAPIView):
    queryset = PoliticaPrestamo.objects.order_by('tipo_usuario')
    serializer_class = PoliticaPrestamoSerializer
    permission_classes = [EsAdministrador]


class PoliticaPrestamoAdminDetailView(generics.RetrieveUpdateAPIView):
    queryset = PoliticaPrestamo.objects.all()
    serializer_class = PoliticaPrestamoSerializer
    permission_classes = [EsAdministrador]
    http_method_names = ['get', 'patch']


class PrestamoCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=PrestamoCreateSerializer, responses={201: PrestamoSerializer})
    def post(self, request):
        serializer = PrestamoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prestamo = registrar_prestamo(request.user, serializer.validated_data['ficha_recurso'])
        return responder(prestamo, status.HTTP_201_CREATED)


class MisPrestamosView(generics.ListAPIView):
    serializer_class = PrestamoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        actualizar_estados()
        return prestamos_con_detalle().filter(usuario=self.request.user)


class MiPrestamoCancelarView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses=PrestamoSerializer)
    def post(self, request, pk):
        return responder(cancelar_prestamo(pk, request.user))


def validar_filtro_estado(estado):
    if estado not in EstadoPrestamo.values:
        raise ValidationError({'estado': f'Debe ser uno de: {", ".join(EstadoPrestamo.values)}.'})
    return estado


class PrestamoListView(generics.ListAPIView):
    serializer_class = PrestamoSerializer
    permission_classes = [EsAdministrador]

    @extend_schema(parameters=[
        OpenApiParameter('estado', str, description=', '.join(EstadoPrestamo.values)),
        OpenApiParameter('usuario', int, description='id del usuario, para ver su historial'),
        OpenApiParameter('codigo_inventario', str, description='codigo de la etiqueta del ejemplar (LAP-002)'),
        OpenApiParameter('ficha_recurso', str, description='UUID del recurso, para ver su historial'),
    ])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(request=PrestamoAdminCreateSerializer, responses={201: PrestamoSerializer})
    def post(self, request):
        serializer = PrestamoAdminCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data
        prestamo = registrar_prestamo(
            datos['usuario'], datos['ficha_recurso'],
            ejemplar=datos.get('ejemplar'), registrado_por=request.user,
        )
        return responder(prestamo, status.HTTP_201_CREATED)

    def get_queryset(self):
        actualizar_estados()
        queryset = prestamos_con_detalle()
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=validar_filtro_estado(estado))

        usuario = self.request.query_params.get('usuario')
        if usuario:
            if not usuario.isdigit():
                raise ValidationError({'usuario': 'Debe ser el id numerico del usuario.'})
            queryset = queryset.filter(usuario_id=int(usuario))

        codigo = self.request.query_params.get('codigo_inventario')
        if codigo:
            queryset = queryset.filter(ejemplar_fisico__codigo_inventario=codigo.strip().upper())

        ficha = self.request.query_params.get('ficha_recurso')
        if ficha:
            try:
                ficha = uuid.UUID(ficha)
            except ValueError:
                raise ValidationError({'ficha_recurso': 'Debe ser un UUID valido.'})
            queryset = queryset.filter(ejemplar_fisico__ficha_recurso_id=ficha)
        return queryset


class PrestamoDetailView(generics.RetrieveAPIView):
    serializer_class = PrestamoSerializer
    permission_classes = [EsAdministrador]

    def get_queryset(self):
        actualizar_estados()
        return prestamos_con_detalle()


class PrestamoCancelarAdminView(APIView):
    permission_classes = [EsAdministrador]

    @extend_schema(request=None, responses=PrestamoSerializer)
    def post(self, request, pk):
        return responder(cancelar_prestamo(pk))


class PrestamoEntregaView(APIView):
    permission_classes = [EsAdministrador]

    @extend_schema(request=None, responses=PrestamoSerializer)
    def post(self, request, pk):
        return responder(entregar_prestamo(pk, request.user))


class PrestamoDevolucionView(APIView):
    permission_classes = [EsAdministrador]

    @extend_schema(request=DevolucionSerializer, responses=PrestamoSerializer)
    def post(self, request, pk):
        serializer = DevolucionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return responder(registrar_devolucion(pk, serializer.validated_data.get('condicion')))


class PrestamoPerdidoView(APIView):
    permission_classes = [EsAdministrador]

    @extend_schema(request=PerdidaSerializer, responses=PrestamoSerializer)
    def post(self, request, pk):
        serializer = PerdidaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return responder(marcar_perdido(pk, serializer.validated_data.get('observaciones', '')))


class PrestamoRenovarAdminView(APIView):
    permission_classes = [EsAdministrador]

    @extend_schema(request=None, responses=PrestamoSerializer)
    def post(self, request, pk):
        return responder(renovar_prestamo(pk))
