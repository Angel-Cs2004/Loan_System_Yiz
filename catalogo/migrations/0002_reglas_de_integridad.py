import django.db.models.functions.text
from django.db import migrations, models
from django.db.models import Count
from django.db.models.functions import Lower, Upper


def preparar_datos(apps, schema_editor):
    FichaRecurso = apps.get_model('catalogo', 'FichaRecurso')
    Categoria = apps.get_model('catalogo', 'Categoria')
    EjemplarFisico = apps.get_model('catalogo', 'EjemplarFisico')

    repetidos = (
        EjemplarFisico.objects.annotate(c=Upper('codigo_inventario'))
        .values('c').annotate(n=Count('id')).filter(n__gt=1)
    )
    if repetidos:
        raise RuntimeError(f'Codigos de inventario repetidos: {[r["c"] for r in repetidos]}')

    repetidas = Categoria.objects.annotate(n_lower=Lower('nombre')).values('n_lower').annotate(n=Count('id')).filter(n__gt=1)
    if repetidas:
        raise RuntimeError(f'Categorias repetidas: {[r["n_lower"] for r in repetidas]}')

    repetidas = (
        FichaRecurso.objects.annotate(n_lower=Lower('nombre'))
        .values('n_lower', 'categoria').annotate(n=Count('id')).filter(n__gt=1)
    )
    if repetidas:
        raise RuntimeError(f'Fichas repetidas en la misma categoria: {[r["n_lower"] for r in repetidas]}')

    for ejemplar in EjemplarFisico.objects.all():
        texto = ejemplar.condicion.strip()
        ejemplar.observaciones = texto
        ejemplar.condicion = 'REGULAR' if texto else 'BUENO'
        ejemplar.codigo_inventario = ejemplar.codigo_inventario.strip().upper()
        ejemplar.save(update_fields=['observaciones', 'condicion', 'codigo_inventario'])


def revertir_datos(apps, schema_editor):
    EjemplarFisico = apps.get_model('catalogo', 'EjemplarFisico')
    for ejemplar in EjemplarFisico.objects.all():
        ejemplar.condicion = ejemplar.observaciones[:100]
        ejemplar.save(update_fields=['condicion'])


class Migration(migrations.Migration):
    dependencies = [
        ('catalogo', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='ejemplarfisico',
            name='observaciones',
            field=models.TextField(blank=True),
        ),
        migrations.RunPython(preparar_datos, revertir_datos),
        migrations.AlterField(
            model_name='categoria',
            name='nombre',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='ejemplarfisico',
            name='condicion',
            field=models.CharField(choices=[('BUENO', 'Bueno'), ('REGULAR', 'Regular'), ('DANADO', 'Danado')], default='BUENO', max_length=20),
        ),
        migrations.AlterField(
            model_name='ejemplarfisico',
            name='estado',
            field=models.CharField(choices=[('DISPONIBLE', 'Disponible'), ('PRESTADO', 'Prestado'), ('EN_MANTENIMIENTO', 'En mantenimiento'), ('DADO_DE_BAJA', 'Dado de baja')], default='DISPONIBLE', max_length=20),
        ),
        migrations.AddConstraint(
            model_name='categoria',
            constraint=models.UniqueConstraint(django.db.models.functions.text.Lower('nombre'), name='categoria_nombre_unico'),
        ),
        migrations.AddConstraint(
            model_name='ejemplarfisico',
            constraint=models.CheckConstraint(condition=models.Q(('condicion', 'DANADO'), ('estado', 'DISPONIBLE'), _negated=True), name='ejemplar_danado_no_disponible'),
        ),
        migrations.AddConstraint(
            model_name='ficharecurso',
            constraint=models.UniqueConstraint(django.db.models.functions.text.Lower('nombre'), models.F('categoria'), name='ficha_nombre_unico_por_categoria', nulls_distinct=False),
        ),
    ]
