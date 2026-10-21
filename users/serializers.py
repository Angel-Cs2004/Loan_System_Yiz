from rest_framework import serializers
from .models import Usuario, TipoUsuario, EstadoUsuario

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only =True)

    class Meta:
        model = Usuario
        fields = ['email', 'password', 'cui', 'first_name', 'last_name']

    def create(self, validated_data):
        validated_data['tipo_usuario'] = TipoUsuario.STUDENT
        return Usuario.objects.create_user(**validated_data)

class MiTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.status != EstadoUsuario.ACTIVO:
            raise AuthenticationFailed('La cuenta de usuario no está activa.')
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name
        return data

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class PerfilSerializer(serializers.ModelSerializer):

    class Meta:
        model = Usuario
        fields = ['email', 'first_name', 'last_name', 'cui', 'tipo_usuario', 'status']
        read_only_fields = ['email', 'tipo_usuario', 'status']


class UsuarioAdminSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only = True, required = False)
    class Meta: 
        model = Usuario
        fields = ['id', 'email', 'first_name', 'last_name', 'cui', 'tipo_usuario', 'status', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)
