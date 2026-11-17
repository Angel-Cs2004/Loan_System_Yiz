from rest_framework import serializers

from .models import RegistroAuditoria


class RegistroAuditoriaSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source='actor.email', read_only=True, default=None)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)

    class Meta:
        model = RegistroAuditoria
        fields = ['id', 'fecha', 'actor', 'actor_email', 'accion', 'accion_display', 'objeto', 'detalle']
        read_only_fields = fields
