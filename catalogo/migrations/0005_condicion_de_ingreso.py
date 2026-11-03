from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0004_detalles_ejemplar'),
    ]

    operations = [
        migrations.RenameField(
            model_name='ejemplarfisico',
            old_name='detalles',
            new_name='condicion_de_ingreso',
        ),
    ]
