from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


def cerrar_sesiones(usuario):
    pendientes = OutstandingToken.objects.filter(user=usuario, blacklistedtoken__isnull=True)
    BlacklistedToken.objects.bulk_create([BlacklistedToken(token=t) for t in pendientes])
