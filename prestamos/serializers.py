from datetime import timedelta

from django.contrib.auth import get_user_model
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from catalogo.models import CondicionEjemplar, EjemplarFisico, EstadoFicha, FichaRecurso
from catalogo.services import ejemplares_prestables

from .models import EstadoPrestamo, PoliticaPrestamo, Prestamo
from .services import HORAS_PARA_RECOGER


class PoliticaPrestamoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoliticaPrestamo
        fields = ['id', 'tipo_usuario', 'dias_maximo_prestamo', 'max_prestamos_simultaneos']
        read_only_fields = ['id', 'tipo_usuario']


def validar_ficha_prestable(ficha):
    if ficha.estado_ficha != EstadoFicha.ACTIVA:
        raise serializers.ValidationError('Este recurso fue dado de baja y no se puede prestar.')
    if not ejemplares_prestables(ficha).exists():
        raise serializers.ValidationError('No hay ejemplares disponibles de este recurso.')
    return ficha


class PrestamoCreateSerializer(serializers.Serializer):
    ficha_recurso = serializers.PrimaryKeyRelatedField(queryset=FichaRecurso.objects.all())

    def validate_ficha_recurso(self, ficha):
        return validar_ficha_prestable(ficha)


class PrestamoAdminCreateSerializer(serializers.Serializer):
    usuario = serializers.PrimaryKeyRelatedField(queryset=get_user_model().objects.all())
    ficha_recurso = serializers.PrimaryKeyRelatedField(queryset=FichaRecurso.objects.all(), required=False)
    codigo_inventario = serializers.CharField(required=False, max_length=50)

    def validate_usuario(self, usuario):
        if not usuario.is_active:
            raise serializers.ValidationError('El usuario no esta activo.')
        return usuario

    def validate_codigo_inventario(self, codigo):
        codigo = codigo.strip().upper()
        ejemplar = EjemplarFisico.objects.select_related('ficha_recurso').filter(codigo_inventario=codigo).first()
        if ejemplar is None:
            raise serializers.ValidationError(f'No existe un ejemplar con el codigo {codigo}.')
        return ejemplar

    def validate(self, attrs):
        ficha = attrs.get('ficha_recurso')
        ejemplar = attrs.pop('codigo_inventario', None)
        if (ficha is None) == (ejemplar is None):
            raise serializers.ValidationError('Envia ficha_recurso o codigo_inventario (solo uno de los dos).')
        if ejemplar is not None:
            if ejemplar.ficha_recurso.estado_ficha != EstadoFicha.ACTIVA:
                raise serializers.ValidationError({'codigo_inventario': 'Este recurso fue dado de baja y no se puede prestar.'})
            attrs['ficha_recurso'] = ejemplar.ficha_recurso
            attrs['ejemplar'] = ejemplar
        else:
            validar_ficha_prestable(ficha)
        return attrs


class PrestamoSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    codigo_inventario = serializers.CharField(source='ejemplar_fisico.codigo_inventario', read_only=True)
    ficha_recurso_nombre = serializers.CharField(source='ejemplar_fisico.ficha_recurso.nombre', read_only=True)
    tipo_usuario = serializers.CharField(source='usuario.tipo_usuario', read_only=True)
    registrado_por_email = serializers.EmailField(source='registrado_por.email', read_only=True, default=None)
    con_retraso = serializers.SerializerMethodField()
    recoger_antes_de = serializers.SerializerMethodField()

    class Meta:
        model = Prestamo
        fields = ['id', 'usuario', 'usuario_email', 'tipo_usuario', 'ejemplar_fisico', 'codigo_inventario',
                  'ficha_recurso_nombre', 'fecha_prestamo', 'fecha_entrega', 'fecha_limite', 'fecha_devolucion',
                  'estado', 'recoger_antes_de',
                  'con_retraso', 'renovaciones', 'registrado_por_email']
        read_only_fields = fields

    @extend_schema_field(OpenApiTypes.DATETIME)
    def get_recoger_antes_de(self, prestamo):
        if prestamo.estado != EstadoPrestamo.RESERVADO:
            return None
        return serializers.DateTimeField().to_representation(prestamo.fecha_prestamo + timedelta(hours=HORAS_PARA_RECOGER))

    def get_con_retraso(self, prestamo) -> bool:
        if prestamo.fecha_devolucion is not None:
            return prestamo.fecha_devolucion > prestamo.fecha_limite
        return prestamo.estado == EstadoPrestamo.VENCIDO


class DevolucionSerializer(serializers.Serializer):
    condicion = serializers.ChoiceField(choices=CondicionEjemplar.choices, required=False)


class PerdidaSerializer(serializers.Serializer):
    observaciones = serializers.CharField(required=False, allow_blank=True, max_length=500)
