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

- Registro público de usuarios.
- Inicio de sesión con JWT, renovación de token y cierre de sesión con lista negra de tokens.
- Perfil propio: cada usuario consulta y edita sus datos básicos.
- Administración de usuarios: el administrador lista, crea, modifica, reclasifica y elimina usuarios.
- Catálogo de recursos: el administrador crea, edita y elimina recursos; los demás usuarios ven solo los disponibles.
- Reservas: un usuario reserva un recurso disponible y el sistema calcula la fecha límite de devolución según su tipo de usuario.
- Consulta de reservas: cada usuario ve las suyas; el administrador ve todas y puede filtrarlas por estado.
- Devoluciones: el administrador registra la devolución y el recurso vuelve a estar disponible.

## Tecnologías

| Componente | Tecnología |
|---|---|
| Lenguaje | Python 3 |
| Framework | Django 6.1 + Django REST Framework |
| Base de datos | PostgreSQL |
| Autenticación | Simple JWT |
| Documentación | drf-spectacular (Swagger / ReDoc) |
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
python manage.py shell
```

```python
from users.models import Usuario, TipoUsuario
u = Usuario.objects.get(email='tu_correo@ejemplo.com')
u.tipo_usuario = TipoUsuario.ADMINISTRATOR
u.save()
```

Los permisos de administrador del sistema dependen del campo `tipo_usuario`, no de `is_superuser`.

## Documentación de la API

Con el servidor en marcha:

- Swagger UI: <http://127.0.0.1:8000/api/docs/>
- ReDoc: <http://127.0.0.1:8000/api/redoc/>
- Esquema OpenAPI: <http://127.0.0.1:8000/api/schema/>

Para probar los endpoints protegidos en Swagger: haz `POST /login/`, copia el valor de `access`, pulsa **Authorize** y pega solo el token (sin la palabra `Bearer`). El token de acceso dura 15 minutos.

## Endpoints

### Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/users/registro/` | Público | Registro de usuario (entra como estudiante) |
| POST | `/login/` | Público | Obtiene los tokens `access` y `refresh` |
| POST | `/login/refresh/` | Público | Renueva el token de acceso |
| POST | `/users/logout/` | Autenticado | Invalida el token `refresh` |

### Perfil

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET, PATCH | `/users/perfil/` | Autenticado | Ver y editar el perfil propio |

### Administración de usuarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET, POST | `/users/admin/usuarios/` | Administrador | Listar y crear usuarios |
| GET, PUT, PATCH, DELETE | `/users/admin/usuarios/{id}/` | Administrador | Ver, editar, reclasificar y eliminar un usuario |

### Recursos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/prestamos/recursos/` | Autenticado | Listar los recursos disponibles |
| GET, POST | `/prestamos/admin/recursos/` | Administrador | Listar todos los recursos y crear uno |
| GET, PUT, PATCH, DELETE | `/prestamos/admin/recursos/{id}/` | Administrador | Ver, editar y eliminar un recurso |

### Reservas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/prestamos/reservar/` | Autenticado | Reservar un recurso |
| GET | `/prestamos/mis-reservas/` | Autenticado | Ver las reservas propias |
| GET | `/prestamos/admin/reservas/` | Administrador | Listar todas las reservas (filtro opcional `?estado=`) |
| GET, DELETE | `/prestamos/admin/reservas/{id}/` | Administrador | Ver y eliminar una reserva |
| POST | `/prestamos/admin/reservas/{id}/devolver/` | Administrador | Registrar la devolución |

## Reglas de negocio

**Plazo de préstamo** según el tipo de usuario (valores actuales, definidos en `prestamos/services.py`):

| Tipo de usuario | Días |
|---|---|
| Docente | 7 |
| Estudiante | 6 |
| Personal administrativo | 10 |
| Administrador | 2 |

**Estados de una reserva:**

| Estado | Significado |
|---|---|
| `ACTIVO` | El recurso está prestado actualmente |
| `DEVUELTO` | El recurso fue devuelto |
| `VENCIDO` | Se superó la fecha límite sin devolverlo |

**Disponibilidad de recursos:** al reservar, el recurso pasa a no disponible y deja de aparecer en el listado; al registrar la devolución vuelve a estar disponible. Un recurso no disponible no se puede reservar.

## Estructura del proyecto

```
.
├── manage.py
├── requirements.txt
├── .env.example
├── prestamos_sistema/     Configuración del proyecto (settings, urls)
├── users/                 Usuarios, autenticación, perfil y administración de usuarios
│   ├── models.py          Modelo Usuario, tipos y estados
│   ├── permissions.py     Permiso EsAdministrador
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
└── prestamos/             Recursos, reservas y reglas de plazo
    ├── models.py          Recurso, Prestamo, EstadoPrestamo
    ├── services.py        Cálculo de la fecha límite
    ├── serializers.py
    ├── views.py
    └── urls.py
```

## Estado del proyecto

**Implementado:** autenticación JWT, perfil, administración de usuarios, catálogo de recursos, reservas, devoluciones y documentación Swagger.

**Pendiente:**

- Separar el recurso en ficha de catálogo y ejemplar físico, como en el modelo de dominio.
- Períodos de préstamo configurables por el administrador (hoy están fijos en el código).
- Marcado automático de préstamos vencidos.
- Pruebas automatizadas.
- Interfaz web en React.

## Equipo

- Calcina Chuquipalla, Karina Paola
- Huayhua Perez, Lizzy Arlette
- Quispe Suarez, Angelo Josue
- Condori Pallardel, Emilio Alejandro
