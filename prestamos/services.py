from datetime import date, timedelta

DIAS_POR_DEFECTO = 7


def calcular_fecha_limite(usuario):
    dias = usuario.get_max_loan_period() or DIAS_POR_DEFECTO
    return date.today() + timedelta(days=dias)
