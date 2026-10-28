import django.core.validators
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('catalogo', '0002_reglas_de_integridad'),
        ('prestamos', '0007_mover_catalogo'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='prestamo',
            options={'ordering': ['-fecha_prestamo']},
        ),
        migrations.RemoveConstraint(
            model_name='prestamo',
            name='unico_prestamo_activo_por_ejemplar',
        ),
        migrations.AddField(
            model_name='politicaprestamo',
            name='max_prestamos_simultaneos',
            field=models.PositiveIntegerField(default=3, validators=[django.core.validators.MinValueValidator(1)]),
        ),
        migrations.AlterField(
            model_name='politicaprestamo',
            name='dias_maximo_prestamo',
            field=models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)]),
        ),
        migrations.AlterField(
            model_name='politicaprestamo',
            name='tipo_usuario',
            field=models.CharField(choices=[('TEACHER', 'Profesor'), ('STUDENT', 'Estudiante'), ('ADMINISTRATIVE_STAFF', 'Personal administrativo'), ('ADMINISTRATOR', 'Administrador')], max_length=25, unique=True),
        ),
        migrations.AddConstraint(
            model_name='politicaprestamo',
            constraint=models.CheckConstraint(condition=models.Q(('dias_maximo_prestamo__gte', 1)), name='politica_dias_minimo_1'),
        ),
        migrations.AddConstraint(
            model_name='politicaprestamo',
            constraint=models.CheckConstraint(condition=models.Q(('max_prestamos_simultaneos__gte', 1)), name='politica_max_minimo_1'),
        ),
        migrations.AddConstraint(
            model_name='prestamo',
            constraint=models.UniqueConstraint(condition=models.Q(('estado__in', ['ACTIVO', 'VENCIDO'])), fields=('ejemplar_fisico',), name='unico_prestamo_pendiente_por_ejemplar'),
        ),
        migrations.AddConstraint(
            model_name='prestamo',
            constraint=models.CheckConstraint(condition=models.Q(models.Q(('estado', 'DEVUELTO'), ('fecha_devolucion__isnull', False)), models.Q(models.Q(('estado', 'DEVUELTO'), _negated=True), ('fecha_devolucion__isnull', True)), _connector='OR'), name='prestamo_devuelto_con_fecha'),
        ),
    ]
