from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prestamos', '0011_seguimiento_en_prestamo'),
    ]

    operations = [
        migrations.AddField(
            model_name='prestamo',
            name='condicion_entrega',
            field=models.CharField(blank=True, choices=[('BUENO', 'Bueno'), ('REGULAR', 'Regular'), ('DANADO', 'Danado')], max_length=20, null=True),
        ),
    ]
