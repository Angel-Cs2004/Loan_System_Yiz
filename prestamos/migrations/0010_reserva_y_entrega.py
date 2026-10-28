from django.conf import settings
from django.db import migrations, models


def completar_fecha_entrega(apps, schema_editor):
    Prestamo = apps.get_model('prestamos', 'Prestamo')
    Prestamo.objects.filter(fecha_entrega__isnull=True, fecha_limite__isnull=False).update(
        fecha_entrega=models.F('fecha_prestamo'),
    )


class Migration(migrations.Migration):
    dependencies = [
        ('catalogo', '0003_ejemplar_reservado'),
        ('prestamos', '0009_perdido_cancelado_renovaciones'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='prestamo',
            name='unico_prestamo_pendiente_por_ejemplar',
        ),
        migrations.AddField(
            model_name='prestamo',
            name='fecha_entrega',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(completar_fecha_entrega, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='prestamo',
            name='estado',
            field=models.CharField(choices=[('RESERVADO', 'Reservado'), ('ACTIVO', 'Activo'), ('DEVUELTO', 'Devuelto'), ('VENCIDO', 'Vencido'), ('PERDIDO', 'Perdido'), ('CANCELADO', 'Cancelado')], default='RESERVADO', max_length=20),
        ),
        migrations.AlterField(
            model_name='prestamo',
            name='fecha_limite',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddConstraint(
            model_name='prestamo',
            constraint=models.UniqueConstraint(condition=models.Q(('estado__in', ['RESERVADO', 'ACTIVO', 'VENCIDO'])), fields=('ejemplar_fisico',), name='unico_prestamo_pendiente_por_ejemplar'),
        ),
        migrations.AddConstraint(
            model_name='prestamo',
            constraint=models.CheckConstraint(condition=models.Q(models.Q(('estado', 'RESERVADO'), _negated=True), models.Q(('fecha_entrega__isnull', True), ('fecha_limite__isnull', True)), _connector='OR'), name='prestamo_reservado_sin_entrega'),
        ),
        migrations.AddConstraint(
            model_name='prestamo',
            constraint=models.CheckConstraint(condition=models.Q(models.Q(('estado__in', ['ACTIVO', 'VENCIDO', 'DEVUELTO', 'PERDIDO']), _negated=True), models.Q(('fecha_entrega__isnull', False), ('fecha_limite__isnull', False)), _connector='OR'), name='prestamo_entregado_con_fechas'),
        ),
    ]
