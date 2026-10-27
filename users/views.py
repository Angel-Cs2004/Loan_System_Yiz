from django.shortcuts import render
from .serializers import RegistroUsuarioSerializer
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MiTokenObtainPairSerializer, LogoutSerializer, PerfilSerializer, UsuarioAdminSerializer, CambiarPasswordSerializer
from .services import cerrar_sesiones
from .permissions import EsAdministrador
from .models import Usuario, EstadoUsuario
from prestamos.models import EstadoPrestamo

from drf_spectacular.utils import extend_schema


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


class UsuarioAdminListCreateView(generics.ListCreateAPIView):
    serializer_class = UsuarioAdminSerializer
    permission_classes = [EsAdministrador]

    def get_queryset(self):
        queryset = Usuario.objects.all()
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(Q(dni=q) | Q(cui=q))
        return queryset


class UsuarioAdminDetailView(generics.UpdateAPIView, generics.DestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioAdminSerializer
    permission_classes = [EsAdministrador]
    http_method_names = ['patch', 'delete']

    def perform_destroy(self, usuario):
        if usuario.pk == self.request.user.pk:
            raise ValidationError('No puedes darte de baja a ti mismo.')
        pendientes = usuario.prestamos.filter(estado__in=[EstadoPrestamo.ACTIVO, EstadoPrestamo.VENCIDO])
        if pendientes.exists():
            raise ValidationError('El usuario tiene prestamos pendientes.')
        usuario.status = EstadoUsuario.INACTIVO
        usuario.save(update_fields=['status'])
