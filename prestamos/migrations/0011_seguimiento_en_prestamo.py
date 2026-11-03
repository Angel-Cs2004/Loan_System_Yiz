from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prestamos', '0010_reserva_y_entrega'),
    ]

    operations = [
        migrations.AddField(
            model_name='prestamo',
            name='condicion_devolucion',
            field=models.CharField(blank=True, choices=[('BUENO', 'Bueno'), ('REGULAR', 'Regular'), ('DANADO', 'Danado')], max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='prestamo',
            name='observaciones',
            field=models.TextField(blank=True),
        ),
    ]
