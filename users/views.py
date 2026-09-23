from django.shortcuts import render
from .serializers import RegistroUsuarioSerializer
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MiTokenObtainPairSerializer, LogoutSerializer, PerfilSerializer, UsuarioAdminSerializer
from .permissions import EsAdministrador
from .models import Usuario

from drf_spectacular.utils import extend_schema


#<================LOGUT==========================>
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=LogoutSerializer)
    def post(self, request):
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=205)

#<================REGISTER ======================>
class RegistroUsuarioView(generics.CreateAPIView):
    serializer_class = RegistroUsuarioSerializer


## <==============TOKEN==========================>
class MiTokenObtainPairView(TokenObtainPairView):
    serializer_class = MiTokenObtainPairSerializer


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = PerfilSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UsuarioAdminListCreateView(generics.ListCreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioAdminSerializer
    permission_classes = [EsAdministrador]


class UsuarioAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioAdminSerializer
    permission_classes = [EsAdministrador]
