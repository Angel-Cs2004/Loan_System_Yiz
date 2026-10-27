from rest_framework import serializers

from .models import Categoria, EjemplarFisico, EstadoEjemplar, EstadoFicha, FichaRecurso
from .services import ESTADOS_INICIALES, ESTADOS_MANUALES, validar_estado_y_condicion


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']
        read_only_fields = ['id']

    def validate_nombre(self, nombre):
        categorias = Categoria.objects.filter(nombre__iexact=nombre)
        if self.instance is not None:
            categorias = categorias.exclude(pk=self.instance.pk)
        if categorias.exists():
            raise serializers.ValidationError('Ya existe una categoria con este nombre.')
        return nombre


class EjemplarFisicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EjemplarFisico
        fields = ['id', 'ficha_recurso', 'codigo_inventario', 'estado', 'condicion', 'observaciones']
        read_only_fields = ['id', 'ficha_recurso']

    def validate_codigo_inventario(self, codigo):
        codigo = codigo.strip().upper()
        ejemplares = EjemplarFisico.objects.filter(codigo_inventario=codigo)
        if self.instance is not None:
            ejemplares = ejemplares.exclude(pk=self.instance.pk)
        if ejemplares.exists():
            raise serializers.ValidationError('Ya existe un ejemplar con este codigo de inventario.')
        return codigo

    def validate_estado(self, estado):
        if self.instance is None:
            if estado not in ESTADOS_INICIALES:
                raise serializers.ValidationError('Un ejemplar nuevo solo puede registrarse disponible o en mantenimiento.')
            return estado

        if self.instance.estado == EstadoEjemplar.PRESTADO and estado != EstadoEjemplar.PRESTADO:
            raise serializers.ValidationError('El ejemplar esta prestado; su estado cambia al registrar la devolucion.')
        if estado != self.instance.estado and estado not in ESTADOS_MANUALES:
            raise serializers.ValidationError('El estado prestado solo lo asigna el sistema al registrar un prestamo.')
        return estado

    def validate(self, attrs):
        estado = attrs.get('estado', getattr(self.instance, 'estado', EstadoEjemplar.DISPONIBLE))
        condicion = attrs.get('condicion', getattr(self.instance, 'condicion', None))
        validar_estado_y_condicion(estado, condicion)

        if self.instance is None:
            ficha = self.context['ficha']
            if ficha.estado_ficha == EstadoFicha.DADA_DE_BAJA:
                raise serializers.ValidationError('No se pueden agregar ejemplares a un recurso dado de baja.')
        return attrs


class FichaRecursoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True, default=None)
    total_ejemplares = serializers.SerializerMethodField()
    disponibles = serializers.SerializerMethodField()
    disponibilidad = serializers.SerializerMethodField()

    class Meta:
        model = FichaRecurso
        fields = ['id', 'nombre', 'descripcion', 'categoria', 'categoria_nombre', 'estado_ficha',
                  'total_ejemplares', 'disponibles', 'disponibilidad']
        read_only_fields = ['id', 'estado_ficha']
        extra_kwargs = {'categoria': {'required': True, 'allow_null': False}}

    def _conteos(self, ficha):
        if not hasattr(ficha, 'total_ejemplares'):
            anotada = FichaRecurso.objects.con_disponibilidad().get(pk=ficha.pk)
            ficha.total_ejemplares = anotada.total_ejemplares
            ficha.disponibles = anotada.disponibles
        return ficha.total_ejemplares, ficha.disponibles

    def get_total_ejemplares(self, ficha) -> int:
        return self._conteos(ficha)[0]

    def get_disponibles(self, ficha) -> int:
        return self._conteos(ficha)[1]

    def get_disponibilidad(self, ficha) -> str:
        return FichaRecurso.calcular_disponibilidad(*self._conteos(ficha))

    def validate(self, attrs):
        nombre = attrs.get('nombre', getattr(self.instance, 'nombre', None))
        categoria = attrs.get('categoria', getattr(self.instance, 'categoria', None))
        fichas = FichaRecurso.objects.filter(nombre__iexact=nombre, categoria=categoria)
        if self.instance is not None:
            fichas = fichas.exclude(pk=self.instance.pk)
        if fichas.exists():
            raise serializers.ValidationError({'nombre': 'Ya existe un recurso con este nombre en la categoria.'})
        return attrs


class FichaRecursoAdminSerializer(FichaRecursoSerializer):
    ejemplares = EjemplarFisicoSerializer(many=True, read_only=True)

    class Meta(FichaRecursoSerializer.Meta):
        fields = FichaRecursoSerializer.Meta.fields + ['ejemplares']
        read_only_fields = FichaRecursoSerializer.Meta.read_only_fields + ['ejemplares']
