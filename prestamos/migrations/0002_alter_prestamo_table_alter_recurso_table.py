from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('prestamos', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='prestamo',
            table='prestamos',
        ),
        migrations.AlterModelTable(
            name='recurso',
            table='recursos',
        ),
    ]
