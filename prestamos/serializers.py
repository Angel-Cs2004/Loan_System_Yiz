from rest_framework import serializers

from catalogo.models import CondicionEjemplar, EstadoFicha, FichaRecurso
from catalogo.services import ejemplares_prestables

from .models import PoliticaPrestamo, Prestamo


class PoliticaPrestamoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoliticaPrestamo
        fields = ['id', 'tipo_usuario', 'dias_maximo_prestamo']
        read_only_fields = ['id']


class PrestamoCreateSerializer(serializers.ModelSerializer):
    ficha_recurso = serializers.PrimaryKeyRelatedField(queryset=FichaRecurso.objects.all(), write_only=True)

    class Meta:
        model = Prestamo
        fields = ['id', 'ficha_recurso']
        read_only_fields = ['id']

    def validate_ficha_recurso(self, ficha):
        if ficha.estado_ficha != EstadoFicha.ACTIVA:
            raise serializers.ValidationError('Este recurso fue dado de baja y no se puede prestar.')
        if not ejemplares_prestables(ficha).exists():
            raise serializers.ValidationError('No hay ejemplares disponibles de este recurso.')
        return ficha


class PrestamoSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    codigo_inventario = serializers.CharField(source='ejemplar_fisico.codigo_inventario', read_only=True)
    ficha_recurso_nombre = serializers.CharField(source='ejemplar_fisico.ficha_recurso.nombre', read_only=True)

    class Meta:
        model = Prestamo
        fields = ['id', 'usuario', 'usuario_email', 'ejemplar_fisico', 'codigo_inventario',
                  'ficha_recurso_nombre', 'fecha_prestamo', 'fecha_limite', 'fecha_devolucion', 'estado']
        read_only_fields = fields


class DevolucionSerializer(serializers.Serializer):
    condicion = serializers.ChoiceField(choices=CondicionEjemplar.choices, required=False)
