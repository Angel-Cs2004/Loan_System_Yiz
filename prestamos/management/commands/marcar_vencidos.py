from django.core.management.base import BaseCommand

from prestamos.services import actualizar_estados


class Command(BaseCommand):
    help = 'Pasa a VENCIDO los prestamos atrasados y cancela las reservas no recogidas a tiempo.'

    def handle(self, *args, **options):
        vencidos, caducadas = actualizar_estados()
        self.stdout.write(self.style.SUCCESS(
            f'{vencidos} prestamo(s) marcados como vencidos, {caducadas} reserva(s) caducadas.'
        ))
