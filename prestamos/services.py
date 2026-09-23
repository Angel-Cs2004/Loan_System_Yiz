from datetime import date, timedelta

from users.models import TipoUsuario


DIAS_MAXIMOS_POR_TIPO = {
    TipoUsuario.TEACHER:7, TipoUsuario.STUDENT:6,
    TipoUsuario.ADMINISTRATIVE_STAFF: 10,
    TipoUsuario.ADMINISTRATOR:2
}

def calcular_fecha_limite(usuario):
    dias = usuario.get_max_loan_period() or 7
    return date.today() + timedelta(days=dias)

