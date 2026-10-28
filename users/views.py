from django.shortcuts import render
from .serializers import RegistroUsuarioSerializer
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    CambiarPasswordSerializer,
    LogoutSerializer,
    MiTokenObtainPairSerializer,
    PerfilSerializer,
    RestablecerPasswordSerializer,
    SolicitarRestablecimientoSerializer,
    UsuarioAdminSerializer,
)
from .services import (
    aplicar_cambio_de_estado,
    cerrar_sesiones,
    enviar_enlace_restablecimiento,
    restablecer_password,
    validar_cambio_de_estado,
)
from .permissions import EsAdministrador
from .models import EstadoUsuario, TipoUsuario, Usuario

from drf_spectacular.utils import OpenApiParameter, extend_schema


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=LogoutSerializer)
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data['refresh']).blacklist()
        except TokenError:
            raise ValidationError({'refresh': 'Token invalido o expirado.'})
        return Response(status=205)

class RegistroUsuarioView(generics.CreateAPIView):
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [AllowAny]


class MiTokenObtainPairView(TokenObtainPairView):
    serializer_class = MiTokenObtainPairSerializer


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = PerfilSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch']

    def get_object(self):
        return self.request.user


class CambiarPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=CambiarPasswordSerializer)
    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        usuario = request.user
        usuario.set_password(serializer.validated_data['password_nueva'])
        usuario.save(update_fields=['password'])
        cerrar_sesiones(usuario)
        refresh = RefreshToken.for_user(usuario)
        return Response({'refresh': str(refresh), 'access': str(refresh.access_token)})


def validar_opcion(params, nombre, opciones):
    valor = params.get(nombre)
    if valor and valor not in opciones.values:
        raise ValidationError({nombre: f'Debe ser uno de: {", ".join(opciones.values)}.'})
    return valor


class SolicitarRestablecimientoView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=SolicitarRestablecimientoSerializer, responses={200: None})
    def post(self, request):
        serializer = SolicitarRestablecimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enviar_enlace_restablecimiento(serializer.validated_data['email'])
        return Response({'detail': 'Si el correo esta registrado, te llegara un enlace para restablecer tu contrasena.'})


class RestablecerPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RestablecerPasswordSerializer, responses={200: None})
    def post(self, request):
        serializer = RestablecerPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        restablecer_password(serializer.validated_data['usuario'], serializer.validated_data['password_nueva'])
        return Response({'detail': 'Contrasena actualizada. Ya puedes iniciar sesion.'})


class UsuarioAdminListCreateView(generics.ListCreateAPIView):
    serializer_class = UsuarioAdminSerializer
    permission_classes = [EsAdministrador]

    @extend_schema(parameters=[
        OpenApiParameter('q', str, description='DNI o CUI exacto, o parte del nombre, apellido o email'),
        OpenApiParameter('tipo_usuario', str, description=', '.join(TipoUsuario.values)),
        OpenApiParameter('status', str, description=', '.join(EstadoUsuario.values)),
    ])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Usuario.objects.order_by('email')
        params = self.request.query_params

        q = params.get('q', '').strip()
        if q:
            por_texto = Q()
            for palabra in q.split():
                por_texto &= (
                    Q(first_name__icontains=palabra) | Q(last_name__icontains=palabra)
                    | Q(email__icontains=palabra)
                )
            queryset = queryset.filter(Q(dni=q) | Q(cui=q) | por_texto)

        tipo = validar_opcion(params, 'tipo_usuario', TipoUsuario)
        if tipo:
            queryset = queryset.filter(tipo_usuario=tipo)
        status = validar_opcion(params, 'status', EstadoUsuario)
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class UsuarioAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioAdminSerializer
    permission_classes = [EsAdministrador]
    http_method_names = ['get', 'patch', 'delete']

    def perform_destroy(self, usuario):
        if usuario.pk == self.request.user.pk:
            raise ValidationError('No puedes darte de baja a ti mismo.')
        validar_cambio_de_estado(usuario, EstadoUsuario.INACTIVO)
        aplicar_cambio_de_estado(usuario, EstadoUsuario.INACTIVO)
