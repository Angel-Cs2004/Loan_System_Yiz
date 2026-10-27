import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('prestamos', '0004_datos_ficha_ejemplar_politica'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name='prestamo',
            name='recurso',
        ),
        migrations.AlterField(
            model_name='prestamo',
            name='ejemplar_fisico',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prestamos', to='prestamos.ejemplarfisico'),
        ),
        migrations.AddConstraint(
            model_name='prestamo',
            constraint=models.UniqueConstraint(condition=models.Q(('estado', 'ACTIVO')), fields=('ejemplar_fisico',), name='unico_prestamo_activo_por_ejemplar'),
        ),
        migrations.DeleteModel(
            name='Recurso',
        ),
    ]
