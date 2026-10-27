from django.contrib import admin

from .models import PoliticaPrestamo, Prestamo


@admin.register(PoliticaPrestamo)
class PoliticaPrestamoAdmin(admin.ModelAdmin):
    list_display = ['tipo_usuario', 'dias_maximo_prestamo']


@admin.register(Prestamo)
class PrestamoAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'ejemplar_fisico', 'fecha_prestamo', 'fecha_limite', 'fecha_devolucion', 'estado']
    list_filter = ['estado']
    search_fields = ['usuario__email', 'ejemplar_fisico__codigo_inventario']
