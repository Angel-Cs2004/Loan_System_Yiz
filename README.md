# Sistema de Préstamos

Sistema de préstamos para una institución educativa. El backend está construido con **Django REST Framework** y **PostgreSQL**, con autenticación **JWT** y documentación **Swagger**. Gestiona usuarios por rol, recursos, reservas y devoluciones. El frontend está previsto en **React**.

Proyecto de la asignatura *Trabajo Interdisciplinario II* — Escuela Profesional de Ciencia de la Computación, Universidad Nacional de San Agustín de Arequipa (UNSA), 2026.

## Tabla de contenido

- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Roles de usuario](#roles-de-usuario)
- [Instalación](#instalación)
- [Endpoints](#endpoints)
- [Reglas de negocio](#reglas-de-negocio)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Estado del proyecto](#estado-del-proyecto)
- [Equipo](#equipo)

## Funcionalidades

- **Cuentas:** registro público de estudiantes, inicio de sesión con JWT, renovación de token, cierre de sesión con lista negra de tokens, cambio de contraseña y recuperación por correo ("olvidé mi contraseña").
- **Perfil propio:** cada usuario consulta y edita sus datos básicos.
- **Administración de usuarios:** el administrador lista (con búsqueda y filtros), crea, modifica, reclasifica, suspende y da de baja usuarios. La baja es lógica: se conserva el historial.
- **Catálogo:** recursos (fichas) agrupados en categorías, cada uno con sus unidades físicas (ejemplares) identificadas por código de inventario. Los usuarios ven solo los recursos activos y cuántas unidades hay libres.
- **Reservas desde la app:** el usuario reserva un recurso y tiene 24 horas para recogerlo en el mostrador; puede cancelar mientras no lo haya recogido.
- **Préstamos en el mostrador:** el administrador entrega las reservas o presta directamente a quien viene en persona (por recurso o por código de inventario).
- **Devoluciones, pérdidas y renovaciones**, registradas por el administrador.
- **Reglas por tipo de usuario:** días de préstamo y máximo de préstamos a la vez, configurables por el administrador.
- **Vencimientos automáticos:** un préstamo pasa a vencido al superar su fecha límite; quien tiene algo vencido no puede pedir más.
- **Historial completo:** nada se borra; se puede consultar por usuario, por recurso, por unidad o por estado.

## Tecnologías

| Componente | Tecnología |
|---|---|
| Lenguaje | Python 3 |
| Framework | Django 6.1 + Django REST Framework |
| Base de datos | PostgreSQL |
| Autenticación | Simple JWT |
| Documentación | drf-spectacular (Swagger / ReDoc) |
| CORS | django-cors-headers |
| Hash de contraseñas | Argon2 |
| Configuración | python-decouple (variables de entorno) |

## Roles de usuario

| Rol | Valor en el sistema | Permisos |
|---|---|---|
| Estudiante | `STUDENT` | Ver recursos disponibles, reservar, ver sus reservas, editar su perfil |
| Docente | `TEACHER` | Los mismos que el estudiante |
| Personal administrativo | `ADMINISTRATIVE_STAFF` | Los mismos que el estudiante |
| Administrador | `ADMINISTRATOR` | Todo lo anterior, más la gestión de usuarios, recursos y reservas |

Todo usuario que se registra desde el endpoint público entra como `STUDENT`. Solo un administrador puede cambiarle el tipo.

## Instalación

### Requisitos

- Python 3.12 o superior
- PostgreSQL

### Pasos

1. Clonar el repositorio y entrar a la carpeta:

   ```bash
   git clone <url-del-repositorio>
   cd <carpeta-del-proyecto>
   ```

2. Crear y activar el entorno virtual:

   ```bash
   python -m venv env
   source env/bin/activate
   ```

3. Instalar las dependencias:

   ```bash
   pip install -r requirements.txt
   ```

4. Crear la base de datos y el usuario en PostgreSQL (ajusta los nombres si prefieres otros):

   ```sql
   CREATE DATABASE prestamos_db;
   CREATE USER prestamos_user WITH PASSWORD 'tu_contraseña';
   GRANT ALL PRIVILEGES ON DATABASE prestamos_db TO prestamos_user;
   ```

   En PostgreSQL 15 o superior también hace falta dar permisos sobre el esquema público:

   ```sql
   \c prestamos_db
   GRANT ALL ON SCHEMA public TO prestamos_user;
   ```

5. Crear el archivo de variables de entorno a partir de la plantilla y completarlo:

   ```bash
   cp .env.example .env
   ```

   | Variable | Descripción |
   |---|---|
   | `SECRET_KEY` | Clave secreta de Django. Genera una propia. |
   | `DEBUG` | `True` en desarrollo. Si no se define, queda en `False`. |
   | `ALLOWED_HOSTS` | Hosts permitidos, separados por comas. |
   | `DB_NAME` | Nombre de la base de datos. |
   | `DB_USER` | Usuario de PostgreSQL. |
   | `DB_PASSWORD` | Contraseña del usuario. |
   | `DB_HOST` | Host de la base de datos (`localhost`). |
   | `DB_PORT` | Puerto (`5432`). |
   | `FRONTEND_URL` | Dirección del frontend; se usa en el enlace del correo de recuperación de contraseña. |
   | `CORS_ALLOWED_ORIGINS` | Direcciones desde las que el navegador puede llamar a la API, separadas por comas. Si no se define, se usa `FRONTEND_URL`. |
   | `EMAIL_BACKEND` | `console` (los correos se imprimen en la terminal) o `smtp` (se envían de verdad). |
   | `DEFAULT_FROM_EMAIL` | Remitente de los correos. |
   | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | Solo si `EMAIL_BACKEND=smtp`. |

   Para generar un `SECRET_KEY`:

   ```bash
   python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
   ```

6. Aplicar las migraciones:

   ```bash
   python manage.py migrate
   ```

7. Iniciar el servidor:

   ```bash
   python manage.py runserver
   ```

### Crear el primer administrador

El registro público siempre crea estudiantes, así que el primer administrador se crea por consola:

```bash
python manage.py createsuperuser
```

`createsuperuser` ya lo crea con `tipo_usuario = ADMINISTRATOR`. Los permisos de administrador de la API dependen de ese campo, no de `is_superuser`.

### Tareas programadas (opcional)

La API actualiza sola los préstamos vencidos y las reservas no recogidas cada vez que alguien consulta o reserva. Para tener la base al día aunque nadie entre al sistema, se puede programar en cron:

```bash
5 0 * * * cd /ruta/al/proyecto && env/bin/python manage.py marcar_vencidos
```

### Pruebas

```bash
python manage.py test
```

## Documentación de la API

Con el servidor en marcha:

- Swagger UI: <http://127.0.0.1:8000/api/docs/>
- ReDoc: <http://127.0.0.1:8000/api/redoc/>
- Esquema OpenAPI: <http://127.0.0.1:8000/api/schema/>

Para probar los endpoints protegidos en Swagger: haz `POST /login/`, copia el valor de `access`, pulsa **Authorize** y pega solo el token (sin la palabra `Bearer`). El token de acceso dura 15 minutos.

## Endpoints

La referencia completa para el frontend (cuerpos, respuestas y errores de cada endpoint) está en `guia/guia_api_frontend.pdf`. Todas las listas vienen paginadas: `{"count", "next", "previous", "results"}`, 20 por página (`?page=2`, `?page_size=50`, máximo 100).

### Cuentas y perfil

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/users/registro/` | Público | Registro (entra como estudiante) |
| POST | `/login/` | Público | Obtiene los tokens `access` y `refresh` |
| POST | `/login/refresh/` | Público | Renueva el token de acceso |
| POST | `/users/logout/` | Autenticado | Invalida el token `refresh` |
| POST | `/users/password/olvide/` | Público | Envía por correo el enlace para restablecer la contraseña |
| POST | `/users/password/restablecer/` | Público | Pone la contraseña nueva con el `uid` y `token` del enlace |
| GET, PATCH | `/users/perfil/` | Autenticado | Ver y editar el perfil propio |
| POST | `/users/perfil/password/` | Autenticado | Cambiar la contraseña propia |

### Administración de usuarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET, POST | `/users/admin/usuarios/` | Administrador | Listar (`?q=` DNI, CUI, nombre o email; `?tipo_usuario=`; `?status=`) y crear |
| GET, PATCH, DELETE | `/users/admin/usuarios/{id}/` | Administrador | Ver, editar, reclasificar, suspender o dar de baja |

### Catálogo

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/catalogo/recursos/` | Autenticado | Recursos activos (`?q=`, `?categoria=`, `?solo_disponibles=true`) |
| GET | `/catalogo/recursos/{id}/` | Autenticado | Ver un recurso |
| GET | `/catalogo/categorias/` | Autenticado | Listar categorías |
| GET, POST | `/catalogo/admin/recursos/` | Administrador | Todos los recursos con sus ejemplares, y crear uno |
| GET, PATCH, DELETE | `/catalogo/admin/recursos/{id}/` | Administrador | Ver, editar o eliminar (solo si nunca se prestó) |
| POST | `/catalogo/admin/recursos/{id}/baja/` | Administrador | Retirar del catálogo (cancela sus reservas sin recoger) |
| POST | `/catalogo/admin/recursos/{id}/reactivar/` | Administrador | Volver a publicar |
| GET, POST | `/catalogo/admin/recursos/{id}/ejemplares/` | Administrador | Listar o registrar unidades físicas |
| GET, PATCH, DELETE | `/catalogo/admin/ejemplares/{id}/` | Administrador | Ver, editar o eliminar una unidad |
| GET, POST | `/catalogo/admin/categorias/` | Administrador | Listar y crear categorías |
| GET, PATCH, DELETE | `/catalogo/admin/categorias/{id}/` | Administrador | Ver, editar o eliminar una categoría |

### Préstamos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/prestamos/reservar/` | Autenticado | Reservar un recurso (queda `RESERVADO`, 24 h para recogerlo) |
| GET | `/prestamos/mis-reservas/` | Autenticado | Ver mis préstamos y reservas |
| POST | `/prestamos/mis-reservas/{id}/cancelar/` | Autenticado | Cancelar mi reserva antes de recogerla |
| GET | `/prestamos/admin/reservas/` | Administrador | Historial (`?estado=`, `?usuario=`, `?codigo_inventario=`, `?ficha_recurso=`) |
| POST | `/prestamos/admin/reservas/` | Administrador | Prestar en el mostrador (queda `ACTIVO`) |
| GET | `/prestamos/admin/reservas/{id}/` | Administrador | Ver un préstamo |
| POST | `/prestamos/admin/reservas/{id}/entregar/` | Administrador | Entregar una reserva (pasa a `ACTIVO`) |
| POST | `/prestamos/admin/reservas/{id}/cancelar/` | Administrador | Cancelar una reserva sin recoger |
| POST | `/prestamos/admin/reservas/{id}/devolver/` | Administrador | Registrar la devolución |
| POST | `/prestamos/admin/reservas/{id}/perdido/` | Administrador | Registrar que el recurso se perdió |
| POST | `/prestamos/admin/reservas/{id}/renovar/` | Administrador | Extender la fecha límite (una vez) |
| GET | `/prestamos/admin/politicas/` | Administrador | Ver las reglas por tipo de usuario |
| GET, PATCH | `/prestamos/admin/politicas/{id}/` | Administrador | Cambiar días y máximo de préstamos a la vez |

## Reglas de negocio

**Reglas por tipo de usuario** (valores iniciales; el administrador los cambia en `/prestamos/admin/politicas/`):

| Tipo de usuario | Días de préstamo | Máximo a la vez |
|---|---|---|
| Docente | 7 | 3 |
| Estudiante | 6 | 3 |
| Personal administrativo | 10 | 3 |
| Administrador | 2 | 3 |

**Ciclo de un préstamo:**

```
Desde la app:   reservar → RESERVADO ──(admin entrega)──► ACTIVO
                               └──(cancela o pasan 24 h)──► CANCELADO
En el mostrador:            prestar ──────────────────────► ACTIVO
ACTIVO ──(pasa la fecha límite)──► VENCIDO
ACTIVO o VENCIDO ──► DEVUELTO (devolución) o PERDIDO (pérdida)
```

| Estado | Significado |
|---|---|
| `RESERVADO` | Reservado desde la app, esperando que lo recojan (máximo 24 h) |
| `ACTIVO` | El usuario tiene el recurso y está dentro del plazo |
| `VENCIDO` | Superó la fecha límite sin devolverlo |
| `DEVUELTO` | Se devolvió (a tiempo o con retraso) |
| `PERDIDO` | El recurso no volvió; su unidad queda dada de baja |
| `CANCELADO` | La reserva se anuló antes de recogerla |

**Reglas al reservar o prestar:**

- Quien tiene un préstamo vencido no puede pedir otro hasta devolverlo.
- Un solo ejemplar de cada recurso por persona.
- No se puede superar el máximo de préstamos a la vez de su tipo (las reservas sin recoger también cuentan).
- Los días se cuentan desde la entrega, no desde la reserva.
- Una renovación por préstamo, solo si no está vencido.

**Catálogo:** cada recurso (ficha) tiene unidades físicas (ejemplares) con estado `DISPONIBLE`, `RESERVADO`, `PRESTADO`, `EN_MANTENIMIENTO` o `DADO_DE_BAJA`. `RESERVADO` y `PRESTADO` solo los maneja el sistema. Un ejemplar que vuelve dañado pasa a mantenimiento. Lo que tiene historial no se borra: se da de baja.

**Usuarios:** la baja (`INACTIVO`) exige que no tenga recursos sin devolver. La suspensión (`SUSPENDIDO`) sí se permite aunque deba algo: pierde el acceso y no puede pedir más, pero sus préstamos se siguen devolviendo en el mostrador. En ambos casos sus reservas sin recoger se cancelan.

## Estructura del proyecto

```
.
├── manage.py
├── requirements.txt
├── .env.example                 Plantilla de variables de entorno
├── prestamos_sistema/           Configuración (settings, urls, paginación)
├── users/                       Usuarios, autenticación, perfil y administración de usuarios
│   ├── models.py                Usuario, tipos y estados
│   ├── permissions.py           Permiso EsAdministrador
│   ├── services.py              Cierre de sesiones, cambios de estado, recuperación de contraseña
│   └── serializers.py, views.py, urls.py
├── catalogo/                    Categorías, fichas de recurso y ejemplares físicos
│   ├── models.py
│   ├── services.py              Reglas del catálogo (qué se puede prestar, bajas)
│   └── serializers.py, views.py, urls.py, tests.py
├── prestamos/                   Préstamos, reservas y políticas por tipo de usuario
│   ├── models.py
│   ├── services.py              Reglas de préstamo (reservar, entregar, devolver, vencer...)
│   ├── management/commands/     Comando marcar_vencidos
│   └── serializers.py, views.py, urls.py, tests.py
└── guia/                        Guía de la API para el frontend (LaTeX y PDF)
```

## Estado del proyecto

**Implementado:** autenticación JWT y recuperación de contraseña, perfil, administración de usuarios, catálogo con fichas y ejemplares, reservas con entrega en mostrador, devoluciones, pérdidas, renovaciones, vencimientos automáticos, políticas configurables, historial con filtros y documentación Swagger. Catálogo y préstamos tienen pruebas automatizadas.

**Pendiente:**

- Límite de intentos en login y registro.
- Pruebas automatizadas del módulo de usuarios (hoy solo cubren cambios de estado, filtros, acceso y recuperación de contraseña).
- Que el administrador no conozca la contraseña de las cuentas que crea (por ejemplo, enviando al usuario un correo para que cree la suya).
- Interfaz web en React.

## Equipo

- Calcina Chuquipalla, Karina Paola
- Huayhua Perez, Lizzy Arlette
- Quispe Suarez, Angelo Josue
- Condori Pallardel, Emilio Alejandro
