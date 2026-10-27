import django.db.models.deletion
from django.db import migrations, models

MODELOS_MOVIDOS = ['categoria', 'ficharecurso', 'ejemplarfisico']


def mover_content_types(apps, schema_editor):
    ContentType = apps.get_model('contenttypes', 'ContentType')
    ContentType.objects.filter(app_label='prestamos', model__in=MODELOS_MOVIDOS).update(app_label='catalogo')


def regresar_content_types(apps, schema_editor):
    ContentType = apps.get_model('contenttypes', 'ContentType')
    ContentType.objects.filter(app_label='catalogo', model__in=MODELOS_MOVIDOS).update(app_label='prestamos')


class Migration(migrations.Migration):
    dependencies = [
        ('prestamos', '0006_prestamo_usuario_protect'),
        ('catalogo', '0001_initial'),
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name='prestamo',
                    name='ejemplar_fisico',
                    field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='prestamos', to='catalogo.ejemplarfisico'),
                ),
                migrations.DeleteModel(name='EjemplarFisico'),
                migrations.DeleteModel(name='FichaRecurso'),
                migrations.DeleteModel(name='Categoria'),
            ],
        ),
        migrations.RunPython(mover_content_types, regresar_content_types),
    ]
