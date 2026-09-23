from rest_framework import serializers

from .models import Prestamo, Recurso


class RecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recurso
        fields = ['id', 'nombre', 'descripcion', 'disponible']
        read_only_fields = ['id']


class PrestamoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prestamo
        fields = ['id', 'recurso']
        read_only_fields = ['id']

    def validate_recurso(self, recurso):
        if not recurso.disponible:
            raise serializers.ValidationError('NO disponible EL RECURSO')
        return recurso


class PrestamoSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    recurso_nombre = serializers.CharField(source='recurso.nombre', read_only=True)

    class Meta:
        model = Prestamo
        fields = ['id', 'usuario', 'usuario_email', 'recurso', 'recurso_nombre',
                  'fecha_prestamo', 'fecha_limite', 'fecha_devolucion', 'estado']
        read_only_fields = fields
