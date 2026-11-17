from django.contrib import admin

from .models import RegistroAuditoria


@admin.register(RegistroAuditoria)
class RegistroAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'actor', 'accion', 'objeto')
    list_filter = ('accion', 'fecha')
    search_fields = ('objeto', 'detalle')
    readonly_fields = ('fecha', 'actor', 'accion', 'objeto', 'detalle')
