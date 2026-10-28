import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('prestamos', '0008_politica_limites_y_prestamo_pendiente_unico'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='prestamo',
            name='registrado_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='prestamos_registrados', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='prestamo',
            name='renovaciones',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='prestamo',
            name='estado',
            field=models.CharField(choices=[('ACTIVO', 'Activo'), ('DEVUELTO', 'Devuelto'), ('VENCIDO', 'Vencido'), ('PERDIDO', 'Perdido'), ('CANCELADO', 'Cancelado')], default='ACTIVO', max_length=20),
        ),
    ]
