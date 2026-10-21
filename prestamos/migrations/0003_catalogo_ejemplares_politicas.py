import uuid

import django.db.models.deletion
from django.db import migrations, models


def migrate_resources_to_copies(apps, schema_editor):
    Ficha = apps.get_model('prestamos', 'FichaRecurso')
    Copy = apps.get_model('prestamos', 'EjemplarFisico')
    Loan = apps.get_model('prestamos', 'Prestamo')

    for ficha in Ficha.objects.all().iterator():
        active_loans = list(Loan.objects.filter(recurso_id=ficha.pk, estado='ACTIVO'))
        copies_by_loan = {}
        for loan in active_loans:
            copy = Copy.objects.create(
                ficha_recurso_id=ficha.pk,
                codigo_inventario=f'MIG-{uuid.uuid4().hex[:32]}',
                estado='PRESTADO',
                condicion='Migrado desde el catálogo anterior',
            )
            copies_by_loan[loan.pk] = copy

        if not copies_by_loan:
            copy_state = 'DISPONIBLE' if ficha.disponible else 'EN_MANTENIMIENTO'
            fallback = Copy.objects.create(
                ficha_recurso_id=ficha.pk,
                codigo_inventario=f'MIG-{uuid.uuid4().hex[:32]}',
                estado=copy_state,
                condicion='Migrado desde el catálogo anterior',
            )
        else:
            fallback = next(iter(copies_by_loan.values()))

        for loan in Loan.objects.filter(recurso_id=ficha.pk).exclude(estado='ACTIVO'):
            loan.ejemplar_fisico_id = fallback.pk
            loan.save(update_fields=['ejemplar_fisico'])
        for loan_id, copy in copies_by_loan.items():
            Loan.objects.filter(pk=loan_id).update(ejemplar_fisico_id=copy.pk)


class Migration(migrations.Migration):
    dependencies = [('prestamos', '0002_alter_prestamo_table_alter_recurso_table')]

    operations = [
        migrations.CreateModel(
            name='Categoria',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=100, unique=True)),
            ],
            options={'db_table': 'categorias'},
        ),
        migrations.CreateModel(
            name='PoliticaPrestamo',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('tipo_usuario', models.CharField(max_length=25, unique=True)),
                ('dias_maximo_prestamo', models.PositiveIntegerField()),
            ],
            options={'db_table': 'politicas_prestamo'},
        ),
        migrations.RenameModel(old_name='Recurso', new_name='FichaRecurso'),
        migrations.AlterModelTable(name='ficharecurso', table='fichas_recurso'),
        migrations.AddField(
            model_name='ficharecurso', name='categoria',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='fichas_recurso', to='prestamos.categoria'),
        ),
        migrations.AddField(
            model_name='ficharecurso', name='estado_ficha',
            field=models.CharField(choices=[('ACTIVA', 'Activa'), ('DADA_DE_BAJA', 'Dada de baja')], default='ACTIVA', max_length=20),
        ),
        migrations.CreateModel(
            name='EjemplarFisico',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('codigo_inventario', models.CharField(max_length=50, unique=True)),
                ('estado', models.CharField(choices=[('DISPONIBLE', 'Disponible'), ('PRESTADO', 'Prestado'), ('EN_MANTENIMIENTO', 'En mantenimiento')], default='DISPONIBLE', max_length=20)),
                ('condicion', models.CharField(blank=True, max_length=100)),
                ('ficha_recurso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ejemplares', to='prestamos.ficharecurso')),
            ],
            options={'db_table': 'ejemplares_fisicos'},
        ),
        migrations.AddField(
            model_name='prestamo', name='ejemplar_fisico',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='prestamos', to='prestamos.ejemplarfisico'),
        ),
        migrations.RunPython(migrate_resources_to_copies, migrations.RunPython.noop),
        migrations.RemoveField(model_name='prestamo', name='recurso'),
        migrations.RemoveField(model_name='ficharecurso', name='disponible'),
        migrations.AlterField(
            model_name='prestamo', name='ejemplar_fisico',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prestamos', to='prestamos.ejemplarfisico'),
        ),
        migrations.AddConstraint(
            model_name='prestamo',
            constraint=models.UniqueConstraint(condition=models.Q(('estado', 'ACTIVO')), fields=('ejemplar_fisico',), name='unico_prestamo_activo_por_ejemplar'),
        ),
    ]
