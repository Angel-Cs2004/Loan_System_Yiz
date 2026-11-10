from django.utils.dateparse import parse_date
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics
from rest_framework.exceptions import ValidationError

from users.permissions import EsAdministrador

from .models import AccionAuditoria, RegistroAuditoria
from .serializers import RegistroAuditoriaSerializer


class AuditoriaListView(generics.ListAPIView):
    serializer_class = RegistroAuditoriaSerializer
    permission_classes = [EsAdministrador]

    @extend_schema(parameters=[
        OpenApiParameter('actor', int, description='id del usuario que realizo la accion'),
        OpenApiParameter('accion', str, description=', '.join(AccionAuditoria.values)),
        OpenApiParameter('desde', str, description='fecha minima (YYYY-MM-DD)'),
        OpenApiParameter('hasta', str, description='fecha maxima (YYYY-MM-DD)'),
    ])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = RegistroAuditoria.objects.select_related('actor')
        params = self.request.query_params

        actor = params.get('actor')
        if actor:
            if not actor.isdigit():
                raise ValidationError({'actor': 'Debe ser el id numerico del usuario.'})
            queryset = queryset.filter(actor_id=int(actor))

        accion = params.get('accion')
        if accion:
            if accion not in AccionAuditoria.values:
                raise ValidationError({'accion': f'Debe ser una de: {", ".join(AccionAuditoria.values)}.'})
            queryset = queryset.filter(accion=accion)

        for nombre, lookup in (('desde', 'fecha__date__gte'), ('hasta', 'fecha__date__lte')):
            valor = params.get(nombre)
            if valor:
                fecha = parse_date(valor)
                if fecha is None:
                    raise ValidationError({nombre: 'Debe tener el formato YYYY-MM-DD.'})
                queryset = queryset.filter(**{lookup: fecha})
        return queryset
