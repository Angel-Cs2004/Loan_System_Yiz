from django.contrib import admin

from .models import Categoria, EjemplarFisico, FichaRecurso, PoliticaPrestamo, Prestamo


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre']
    search_fields = ['nombre']


@admin.register(PoliticaPrestamo)
class PoliticaPrestamoAdmin(admin.ModelAdmin):
    list_display = ['tipo_usuario', 'dias_maximo_prestamo']


class EjemplarFisicoInline(admin.TabularInline):
    model = EjemplarFisico
    extra = 0


@admin.register(FichaRecurso)
class FichaRecursoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'categoria', 'estado_ficha']
    list_filter = ['estado_ficha', 'categoria']
    search_fields = ['nombre']
    inlines = [EjemplarFisicoInline]


@admin.register(EjemplarFisico)
class EjemplarFisicoAdmin(admin.ModelAdmin):
    list_display = ['codigo_inventario', 'ficha_recurso', 'estado', 'condicion']
    list_filter = ['estado']
    search_fields = ['codigo_inventario', 'ficha_recurso__nombre']


@admin.register(Prestamo)
class PrestamoAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'ejemplar_fisico', 'fecha_prestamo', 'fecha_limite', 'fecha_devolucion', 'estado']
    list_filter = ['estado']
    search_fields = ['usuario__email', 'ejemplar_fisico__codigo_inventario']
