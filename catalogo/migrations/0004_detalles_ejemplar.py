from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0003_ejemplar_reservado'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='ejemplarfisico',
            name='observaciones',
        ),
        migrations.AddField(
            model_name='ejemplarfisico',
            name='detalles',
            field=models.TextField(blank=True),
        ),
    ]
