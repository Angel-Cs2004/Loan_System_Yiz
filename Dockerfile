FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Herramientas de compilacion por si alguna dependencia no trae rueda precompilada.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Servidor de produccion. Las migraciones y collectstatic se corren al arrancar
# (ver el comando del servicio web en docker-compose.yml).
CMD ["gunicorn", "prestamos_sistema.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
