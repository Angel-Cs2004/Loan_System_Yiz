from rest_framework import serializers

from catalogo.models import Categoria, EjemplarFisico, FichaRecurso

from .models import PoliticaPrestamo, Prestamo


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']
        read_only_fields = ['id']


class PoliticaPrestamoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoliticaPrestamo
        fields = ['id', 'tipo_usuario', 'dias_maximo_prestamo']
        read_only_fields = ['id']


class EjemplarFisicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EjemplarFisico
        fields = ['id', 'ficha_recurso', 'codigo_inventario', 'estado', 'condicion']
        read_only_fields = ['id']


class FichaRecursoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True, default=None)
    disponibles = serializers.SerializerMethodField()

    class Meta:
        model = FichaRecurso
        fields = ['id', 'nombre', 'descripcion', 'categoria', 'categoria_nombre',
                  'estado_ficha', 'disponibles']
        read_only_fields = ['id', 'categoria_nombre', 'disponibles']

    def get_disponibles(self, ficha):
        return ficha.ejemplares.filter(estado='DISPONIBLE').count()


class FichaRecursoAdminSerializer(FichaRecursoSerializer):
    ejemplares = EjemplarFisicoSerializer(many=True, read_only=True)

    class Meta(FichaRecursoSerializer.Meta):
        fields = FichaRecursoSerializer.Meta.fields + ['ejemplares']
        read_only_fields = FichaRecursoSerializer.Meta.read_only_fields + ['ejemplares']


class PrestamoCreateSerializer(serializers.ModelSerializer):
    ficha_recurso = serializers.PrimaryKeyRelatedField(queryset=FichaRecurso.objects.all(), write_only=True)

    class Meta:
        model = Prestamo
        fields = ['id', 'ficha_recurso']
        read_only_fields = ['id']

    def validate_ficha_recurso(self, ficha):
        if not ficha.ejemplares.filter(estado='DISPONIBLE').exists():
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
