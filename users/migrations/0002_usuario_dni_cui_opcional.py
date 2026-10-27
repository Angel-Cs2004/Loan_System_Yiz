import django.core.validators
from django.db import migrations, models


def rellenar_dni_y_email(apps, schema_editor):
    Usuario = apps.get_model('users', 'Usuario')
    for usuario in Usuario.objects.all():
        usuario.dni = f'X{usuario.pk:07d}'
        usuario.email = usuario.email.strip().lower()
        usuario.is_active = usuario.status == 'ACTIVO'
        usuario.save(update_fields=['dni', 'email', 'is_active'])


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='dni',
            field=models.CharField(max_length=8, null=True),
        ),
        migrations.RunPython(rellenar_dni_y_email, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='usuario',
            name='dni',
            field=models.CharField(max_length=8, unique=True, validators=[django.core.validators.RegexValidator('^\\d{8}$', 'Debe tener exactamente 8 digitos.')]),
        ),
        migrations.AlterField(
            model_name='usuario',
            name='cui',
            field=models.CharField(blank=True, max_length=8, null=True, unique=True, validators=[django.core.validators.RegexValidator('^\\d{8}$', 'Debe tener exactamente 8 digitos.')]),
        ),
    ]
