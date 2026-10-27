import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('prestamos', '0006_prestamo_usuario_protect'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
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
                    name='FichaRecurso',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('nombre', models.CharField(max_length=150)),
                        ('descripcion', models.TextField(blank=True)),
                        ('estado_ficha', models.CharField(choices=[('ACTIVA', 'Activa'), ('DADA_DE_BAJA', 'Dada de baja')], default='ACTIVA', max_length=20)),
                        ('categoria', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='fichas_recurso', to='catalogo.categoria')),
                    ],
                    options={
                        'db_table': 'fichas_recurso',
                    },
                ),
                migrations.CreateModel(
                    name='EjemplarFisico',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('codigo_inventario', models.CharField(max_length=50, unique=True)),
                        ('estado', models.CharField(choices=[('DISPONIBLE', 'Disponible'), ('PRESTADO', 'Prestado'), ('EN_MANTENIMIENTO', 'En mantenimiento')], default='DISPONIBLE', max_length=20)),
                        ('condicion', models.CharField(blank=True, max_length=100)),
                        ('ficha_recurso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ejemplares', to='catalogo.ficharecurso')),
                    ],
                    options={
                        'db_table': 'ejemplares_fisicos',
                    },
                ),
            ],
        ),
    ]
