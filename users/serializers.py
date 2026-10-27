from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import Usuario, TipoUsuario

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


def normalizar_email_unico(email, instancia=None):
    email = email.strip().lower()
    usuarios = Usuario.objects.filter(email__iexact=email)
    if instancia is not None:
        usuarios = usuarios.exclude(pk=instancia.pk)
    if usuarios.exists():
        raise serializers.ValidationError('Ya existe un usuario con este email.')
    return email


def validar_password(password, usuario):
    try:
        validate_password(password, usuario)
    except DjangoValidationError as e:
        raise serializers.ValidationError({'password': list(e.messages)})


class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only =True)

    class Meta:
        model = Usuario
        fields = ['email', 'password', 'dni', 'cui', 'first_name', 'last_name']
        extra_kwargs = {'cui': {'required': True, 'allow_null': False, 'allow_blank': False}}

    def validate_email(self, email):
        return normalizar_email_unico(email)

    def validate(self, attrs):
        validar_password(attrs['password'], Usuario(**{k: v for k, v in attrs.items() if k != 'password'}))
        return attrs

    def create(self, validated_data):
        validated_data['tipo_usuario'] = TipoUsuario.STUDENT
        return Usuario.objects.create_user(**validated_data)

class MiTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        attrs[self.username_field] = attrs[self.username_field].strip().lower()
        data = super().validate(attrs)
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name
        data['tipo_usuario'] = self.user.tipo_usuario
        return data

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['email', 'first_name', 'last_name', 'dni', 'cui', 'tipo_usuario', 'status']
        read_only_fields = ['email', 'dni', 'cui', 'tipo_usuario', 'status']


class UsuarioAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only = True, required = False)
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'first_name', 'last_name', 'dni', 'cui', 'tipo_usuario', 'status', 'password']
        read_only_fields = ['id']

    def validate_email(self, email):
        return normalizar_email_unico(email, self.instance)

    def validate(self, attrs):
        instancia = self.instance
        password = attrs.get('password')
        if instancia is None and not password:
            raise serializers.ValidationError({'password': 'Este campo es obligatorio.'})

        request = self.context.get('request')
        if instancia is not None and request is not None and instancia.pk == request.user.pk:
            for campo in ('tipo_usuario', 'status'):
                if campo in attrs and attrs[campo] != getattr(instancia, campo):
                    raise serializers.ValidationError({campo: 'No puedes cambiar tu propio rol ni estado.'})

        tipo = attrs.get('tipo_usuario', getattr(instancia, 'tipo_usuario', None))
        cui = attrs.get('cui', getattr(instancia, 'cui', None))
        if 'cui' in attrs and not cui:
            attrs['cui'] = None
        if tipo == TipoUsuario.STUDENT and not cui:
            raise serializers.ValidationError({'cui': 'El CUI es obligatorio para estudiantes.'})

        if password:
            usuario = instancia or Usuario(**{k: v for k, v in attrs.items() if k != 'password'})
            validar_password(password, usuario)
        return attrs

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)
