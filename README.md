# Loan System — Frontend

Interfaz web para el sistema de préstamos de una biblioteca universitaria. Está construida con React y Vite, y consume la API REST del backend Django REST Framework.

## Funcionalidades

- Inicio y cierre de sesión con autenticación JWT.
- Catálogo de recursos disponibles con búsqueda.
- Administración de usuarios.
- Administración de categorías, fichas de recursos y ejemplares físicos.
- Consulta y edición de políticas de préstamo.
- Consulta de préstamos, filtro por estado y registro de devoluciones.

Las secciones de administración requieren una cuenta con rol de administrador en el backend.

## Funciones disponibles por interfaz

| Sección | Funciones |
|---|---|
| Inicio de sesión | Iniciar sesión con correo y contraseña, mostrar u ocultar la contraseña y cerrar sesión. Al volver a abrir la página, comprueba la sesión guardada con el backend. |
| Recursos | Crear, editar y eliminar categorías y fichas de recursos; consultar el estado y las copias disponibles; crear, editar y eliminar ejemplares físicos asociados a una ficha. |
| Catálogo | Consultar recursos activos con ejemplares disponibles, buscar por nombre y ver categoría, descripción y cantidad disponible. |
| Préstamos | Consultar el historial, filtrar por estado y registrar la devolución de un préstamo activo. |
| Políticas | Consultar las políticas de préstamo y editar los días máximos permitidos. |
| Usuarios | Crear, editar y eliminar usuarios; buscar por nombre, correo o CUI; cambiar tipo de usuario y estado. |

Las operaciones que modifican datos se envían al backend y están sujetas a sus permisos y validaciones.

## Tecnologías

- React
- Vite
- JavaScript
- CSS Modules
- Django REST Framework como API
- PostgreSQL como base de datos del backend

## Estructura

```text
frontend/
|-- package.json                  # Comandos de conveniencia para la aplicación
`-- crud_prestamos/
    |-- index.html                # Documento HTML de entrada
    |-- package.json              # Dependencias y scripts de la aplicación
    |-- vite.config.js            # Vite y proxy de desarrollo hacia Django
    `-- src/
        |-- main.jsx               # Punto de entrada de React
        |-- App.jsx                # Sesión, navegación y panel principal
        |-- App.module.css         # Estilos del panel
        |-- api/
        |   |-- client.js          # Cliente HTTP, token JWT y errores de API
        |   |-- auth.js            # Inicio/cierre de sesión y perfil
        |   |-- users.js           # Llamadas de administración de usuarios
        |   `-- loans.js           # Recursos, ejemplares, categorías, políticas y préstamos
        |-- components/
        |   |-- Login.jsx          # Formulario de inicio de sesión
        |   |-- Login.module.css
        |   |-- UsersList.jsx      # Administración y búsqueda de usuarios
        |   |-- UsersList.module.css
        |   |-- Resources.jsx      # Categorías, fichas y ejemplares físicos
        |   |-- Resources.module.css
        |   |-- Policies.jsx       # Consulta y edición de políticas
        |   |-- Loans.jsx          # Historial, filtros y devoluciones
        |   |-- catalog/
        |   |   |-- ResourceCatalog.jsx      # Búsqueda y listado del catálogo
        |   |   |-- ResourceCatalog.module.css
        |   |   |-- ResourceCard.jsx         # Tarjeta de un recurso
        |   |   `-- ResourceCard.module.css
        `-- styles/
            |-- variables.css     # Variables visuales
            |-- base.css          # Reglas base
            |-- index.css          # Importación de estilos globales
            `-- components.module.css # Clases reutilizables de interfaz
```

La carpeta `frontend/` contiene los comandos de conveniencia; la aplicación React y sus dependencias están en `frontend/crud_prestamos/`. Cada vista usa los módulos de `src/api/` para comunicarse con el backend y sus estilos locales cuando tiene un CSS Module propio.

## Requisitos

- Node.js y npm
- Python y PostgreSQL para ejecutar el backend

## Ejecutar el proyecto en desarrollo

El frontend necesita que el backend y su base de datos estén funcionando.

### 1. Preparar y ejecutar el backend

Desde la raíz del repositorio, configura las variables de entorno que Django requiere: `SECRET_KEY`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. También puedes configurar `DEBUG`, `ALLOWED_HOSTS`, `DB_HOST` y `DB_PORT`.

Después instala las dependencias y aplica las migraciones:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Django estará disponible en `http://127.0.0.1:8000`.

### 2. Preparar y ejecutar el frontend

En otra terminal, desde la carpeta del frontend:

```bash
cd frontend/crud_prestamos
npm install
npm run dev
```

Vite mostrará la dirección local de la aplicación, normalmente `http://localhost:5173`.

Como alternativa, después de instalar las dependencias en `crud_prestamos`, puedes ejecutar los comandos del paquete contenedor desde la carpeta `frontend/`:

```bash
npm run dev
npm run build
npm run lint
```

## Conexión entre frontend y backend

El cliente HTTP está en `frontend/crud_prestamos/src/api/client.js`. Envía solicitudes a rutas como `/login/`, `/users/...` y `/prestamos/...`; el backend Django expone esas rutas desde `prestamos_sistema/urls.py` y las resuelven las aplicaciones `users` y `prestamos`.

El flujo de una solicitud es: **componente React → funciones de `src/api/` → cliente HTTP (`client.js`) → Vite en desarrollo → rutas y vistas de Django REST Framework → base de datos**. La respuesta JSON regresa por el mismo camino y actualiza la interfaz.

### Ejemplo: cargar la lista de usuarios

1. Al abrir la sección **Usuarios**, `UsersList.jsx` llama a `getUsers()` desde `src/api/users.js`.
2. `getUsers()` pide `GET /users/admin/usuarios/` mediante `client.js`, que agrega el token JWT guardado en el navegador.
3. En desarrollo, Vite reenvía la solicitud a Django en `http://127.0.0.1:8000`.
4. Django resuelve la ruta en `users/urls.py`. `UsuarioAdminListCreateView` valida que la cuenta tenga permisos de administrador y consulta los usuarios.
5. Django devuelve los datos en JSON. `UsersList.jsx` los guarda en su estado y React muestra las filas en la tabla.

Si la API devuelve un error, por ejemplo por falta de permisos o porque el servidor no está disponible, el frontend muestra el mensaje recibido o uno indicando que no pudo conectarse.

En desarrollo, Vite actúa como intermediario: las reglas de `frontend/crud_prestamos/vite.config.js` reenvían las rutas `/login`, `/users` y `/prestamos` a `http://127.0.0.1:8000`. El navegador se comunica con Vite y Vite con Django, así que ambos servidores deben estar activos para que la aplicación pueda consultar o modificar datos.

El backend también tiene habilitado `CorsMiddleware` en `prestamos_sistema/settings.py`. La lista `CORS_ALLOWED_ORIGINS` permite los orígenes locales `http://localhost:5173` y `http://127.0.0.1:5173`. CORS aplica cuando el navegador llama directamente a una API en otro origen; con el proxy de Vite, el navegador usa el origen del frontend y el proxy realiza el reenvío. En un despliegue donde frontend y backend tengan dominios distintos, el dominio del frontend debe estar permitido en `CORS_ALLOWED_ORIGINS`. `ALLOWED_HOSTS` cumple otra función: autoriza el nombre de host con el que se accede al servidor Django.

El cliente toma la dirección base de `VITE_API_URL`; si no se define, usa el origen actual. Para que en producción llegue al backend, el valor debe ser el origen de la API, por ejemplo `https://api.ejemplo.edu`, sin añadir `/users` ni `/prestamos`. Esa dirección debe ser accesible desde el navegador y estar coordinada con CORS en Django.

Al iniciar sesión, el frontend envía las credenciales a `POST /login/` y guarda los tokens JWT en `localStorage`. Las solicitudes autenticadas envían el token de acceso como `Authorization: Bearer <token>`. Al cerrar sesión, solicita invalidar el token de renovación y elimina ambos tokens del navegador.

## Rutas principales de la API

| Uso | Ruta |
|---|---|
| Inicio de sesión | `POST /login/` |
| Perfil y comprobación de sesión | `GET /users/perfil/` |
| Administración de usuarios | `/users/admin/usuarios/` |
| Catálogo de recursos | `GET /prestamos/recursos/` |
| Administración de fichas | `/prestamos/admin/recursos/` |
| Ejemplares de una ficha | `/prestamos/admin/recursos/{id}/ejemplares/` |
| Categorías | `/prestamos/admin/categorias/` |
| Políticas de préstamo | `/prestamos/admin/politicas/` |
| Préstamos y devoluciones | `/prestamos/admin/reservas/` |

La documentación interactiva del backend está disponible en `http://127.0.0.1:8000/api/docs/` cuando Django está en ejecución.
