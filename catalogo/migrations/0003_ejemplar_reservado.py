from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('catalogo', '0002_reglas_de_integridad'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ejemplarfisico',
            name='estado',
            field=models.CharField(choices=[('DISPONIBLE', 'Disponible'), ('PRESTADO', 'Prestado'), ('RESERVADO', 'Reservado'), ('EN_MANTENIMIENTO', 'En mantenimiento'), ('DADO_DE_BAJA', 'Dado de baja')], default='DISPONIBLE', max_length=20),
        ),
    ]
