import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('prestamos', '0002_alter_prestamo_table_alter_recurso_table'),
    ]

    operations = [
        migrations.CreateModel(
            name='Categoria',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=100, unique=True)),
            ],
            options={
                'db_table': 'categorias',
            },
        ),
        migrations.CreateModel(
            name='EjemplarFisico',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('codigo_inventario', models.CharField(max_length=50, unique=True)),
                ('estado', models.CharField(choices=[('DISPONIBLE', 'Disponible'), ('PRESTADO', 'Prestado'), ('EN_MANTENIMIENTO', 'En mantenimiento')], default='DISPONIBLE', max_length=20)),
                ('condicion', models.CharField(blank=True, max_length=100)),
            ],
            options={
                'db_table': 'ejemplares_fisicos',
            },
        ),
        migrations.CreateModel(
            name='PoliticaPrestamo',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('tipo_usuario', models.CharField(max_length=25, unique=True)),
                ('dias_maximo_prestamo', models.PositiveIntegerField()),
            ],
            options={
                'db_table': 'politicas_prestamo',
            },
        ),
        migrations.AddField(
            model_name='prestamo',
            name='ejemplar_fisico',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='prestamos', to='prestamos.ejemplarfisico'),
        ),
        migrations.CreateModel(
            name='FichaRecurso',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=150)),
                ('descripcion', models.TextField(blank=True)),
                ('estado_ficha', models.CharField(choices=[('ACTIVA', 'Activa'), ('DADA_DE_BAJA', 'Dada de baja')], default='ACTIVA', max_length=20)),
                ('categoria', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='fichas_recurso', to='prestamos.categoria')),
            ],
            options={
                'db_table': 'fichas_recurso',
            },
        ),
        migrations.AddField(
            model_name='ejemplarfisico',
            name='ficha_recurso',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ejemplares', to='prestamos.ficharecurso'),
        ),
    ]
