from django.contrib import admin

from .models import Categoria, EjemplarFisico, FichaRecurso


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre']
    search_fields = ['nombre']


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
    list_filter = ['estado', 'condicion']
    search_fields = ['codigo_inventario', 'ficha_recurso__nombre']
