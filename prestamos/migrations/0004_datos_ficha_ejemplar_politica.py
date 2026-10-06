from django.db import migrations


DIAS_MAXIMOS_POR_TIPO = {
    'TEACHER': 7,
    'STUDENT': 6,
    'ADMINISTRATIVE_STAFF': 10,
    'ADMINISTRATOR': 2,
}


def migrar_datos(apps, schema_editor):
    PoliticaPrestamo = apps.get_model('prestamos', 'PoliticaPrestamo')
    Recurso = apps.get_model('prestamos', 'Recurso')
    FichaRecurso = apps.get_model('prestamos', 'FichaRecurso')
    EjemplarFisico = apps.get_model('prestamos', 'EjemplarFisico')
    Prestamo = apps.get_model('prestamos', 'Prestamo')

    for tipo_usuario, dias in DIAS_MAXIMOS_POR_TIPO.items():
        PoliticaPrestamo.objects.get_or_create(
            tipo_usuario=tipo_usuario,
            defaults={'dias_maximo_prestamo': dias},
        )

    for recurso in Recurso.objects.all():
        ficha = FichaRecurso.objects.create(
            nombre=recurso.nombre,
            descripcion=recurso.descripcion,
        )
        ejemplar = EjemplarFisico.objects.create(
            ficha_recurso=ficha,
            codigo_inventario=f'LEGACY-{str(recurso.id)[:8]}',
            estado='DISPONIBLE' if recurso.disponible else 'PRESTADO',
        )
        Prestamo.objects.filter(recurso=recurso).update(ejemplar_fisico=ejemplar)


def revertir_datos(apps, schema_editor):
    FichaRecurso = apps.get_model('prestamos', 'FichaRecurso')
    PoliticaPrestamo = apps.get_model('prestamos', 'PoliticaPrestamo')
    FichaRecurso.objects.all().delete()
    PoliticaPrestamo.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('prestamos', '0003_categoria_ejemplarfisico_politicaprestamo_and_more'),
    ]

    operations = [
        migrations.RunPython(migrar_datos, revertir_datos),
    ]
