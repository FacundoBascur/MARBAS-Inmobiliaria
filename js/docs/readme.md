# Backend del sistema inmobiliario MARBAS

Este repositorio contiene el backend diseñado para la plataforma web de MARBAS. El servidor está construido con Node.js y Express, y administra los recursos principales del negocio: propiedades, imágenes, tours 360, autenticación y gestión de consultas.

La aplicación se refactorizó completamente con foco en estabilidad, seguridad y mantenibilidad. La implementación actual tiene una capa de acceso a datos basada en MySQL, manejo de archivos seguro, validación de entradas y protección contra abusos.

## Tecnologías principales

- Node.js
- Express
- MySQL
- JSON Web Tokens (JWT)
- bcrypt
- multer
- nodemailer
- helmet
- cors
- express-rate-limit
- compression

## Arquitectura y responsabilidades

El backend proporciona:

- autenticación con credenciales de administrador y tokens JWT
- renovación de token con refresh token
- operaciones CRUD sobre propiedades
- carga de imágenes y tours 360 con validación estricta
- envío de mensajes de contacto por correo electrónico
- protección de rutas administrativas mediante middleware
- registro y respuesta consistente de errores

## Requisitos previos

- Node.js instalado
- MySQL instalado y accesible
- carpeta `uploads/` con permisos de escritura
- variables de entorno definidas correctamente

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env` en la raíz del proyecto.

3. Correr el servidor:

```bash
node server.js
```

## Variables de entorno requeridas

El servidor valida las siguientes variables antes de iniciar:

- `DB_HOST`
- `DB_USER`
- `DB_NAME`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASSWORD`

Variables adicionales usadas en la configuración:

- `DB_PASSWORD` (opcional, puede quedar vacío)
- `PORT`
- `NODE_ENV`
- `ALLOWED_ORIGINS`
- `JWT_EXPIRE`
- `JWT_REFRESH_EXPIRE`
- `MAX_FILE_SIZE`
- `RATE_LIMIT_WINDOW`
- `RATE_LIMIT_MAX_REQUESTS`
- `EMAIL_FROM`

### Ejemplo mínimo de `.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=marbas
JWT_SECRET=una_clave_muy_segura_y_larga
JWT_EXPIRE=2h
JWT_REFRESH_EXPIRE=7d
EMAIL_USER=tu_correo@outlook.com
EMAIL_PASSWORD=tu_contrasena_de_aplicacion
EMAIL_FROM=MARBAS <tu_correo@outlook.com>
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## Endpoints principales

### Autenticación

#### POST /api/login

Cuerpo JSON:

```json
{
  "usuario": "admin",
  "password": "tu_password"
}
```

Respuesta exitosa:

```json
{
  "token": "...",
  "refreshToken": "...",
  "usuario": "admin",
  "expiresIn": "2h"
}
```

#### POST /api/refresh-token

Cuerpo JSON:

```json
{
  "refreshToken": "..."
}
```

Respuesta exitosa:

```json
{
  "token": "..."
}
```

### Propiedades

#### GET /api/propiedades

Devuelve el listado completo de propiedades. La respuesta incluye los campos almacenados en la base de datos y normaliza las colecciones JSON de la galería y los tours 360.

#### POST /api/propiedades

Ruta protegida. Requiere cabecera:

```
Authorization: Bearer <token>
```

Carga multipart/form-data con los siguientes campos:

- `title`
- `price`
- `location`
- `bedrooms`
- `bathroom`
- `meters`
- `description`
- `tour`
- `latitude`
- `longitude`
- `foto_principal` (único)
- `photo_360` (múltiple)
- `fotos_galeria` (múltiple)

Respuesta exitosa:

```json
{
  "mensaje": "Propiedad guardada exitosamente"
}
```

#### PUT /api/propiedades/:id

Ruta protegida. Actualiza metadatos de la propiedad.

Cuerpo JSON:

```json
{
  "title": "Nuevo título",
  "price": 100000,
  "location": "Ubicación",
  "bedrooms": 2,
  "bathroom": 1,
  "meters": 80,
  "description": "Descripción actualizada",
  "latitude": -34.6,
  "longitude": -58.4
}
```

Respuesta exitosa:

```json
{
  "mensaje": "Propiedad actualizada exitosamente"
}
```

#### DELETE /api/propiedades/:id

Ruta protegida. Elimina la propiedad y borra los archivos asociados de la carpeta `uploads/`.

Respuesta exitosa:

```json
{
  "mensaje": "Propiedad eliminada exitosamente"
}
```

### Contacto

#### POST /api/contacto

Llamada pública protegida por rate limiting.

Cuerpo JSON:

```json
{
  "nombre": "Juan",
  "telefono": "12345678",
  "email": "juan@mail.com",
  "mensaje": "Consulta sobre la propiedad"
}
```

Respuesta exitosa:

```json
{
  "mensaje": "Correo enviado exitosamente"
}
```

## Comportamiento de la aplicación

- El servidor expone estáticamente `uploads/` para servir imágenes.
- Las credenciales de administrador se buscan en la tabla `useradmin` de la base de datos.
- Los datos de la galería y los tours se almacenan como JSON en MySQL y se parsean al recuperar propiedades.
- Si una galería o tour contiene datos corruptos, el servidor maneja el error y retorna la propiedad con las rutas posibles.

## Seguridad aplicada

- `helmet` para reforzar cabeceras HTTP.
- `cors` restringido a orígenes definidos en `ALLOWED_ORIGINS`.
- `express-rate-limit` para proteger rutas generales, login y contacto.
- `bcrypt` para comparar contraseñas almacenadas de forma segura.
- Validación de archivos con `multer` por extensión y tipo MIME.
- Límite de tamaño de archivo configurado mediante `MAX_FILE_SIZE`.
- Sanitización de entradas con `validator` antes de insertar en la base de datos.
- Manejo de errores centralizado para respuestas consistentes.

## Mejoras realizadas

- Pool de conexiones MySQL para evitar bloqueos y mejorar concurrencia.
- Compresión de respuestas HTTP con `compression`.
- Envío de correo con `nodemailer` usando SMTP.
- Gestión segura de archivos en `uploads/` con nombres normalizados.
- Eliminación física de imágenes al borrar una propiedad.
- Renovación de token mediante refresh token.

## Recomendaciones de operación

- No subir `.env` al repositorio.
- Usar una clave JWT fuerte y rotarla periódicamente.
- Verificar que `uploads/` tenga permisos de escritura antes de ejecutar el servidor.
- Revisar el estado de la conexión SMTP cuando se activa la funcionalidad de contacto.
- Usar HTTPS en producción y configurar un proxy o balanceador cuando sea necesario.

## Validación de entorno y arranque

Al iniciar el servidor, se comprueba:

- que existan las variables de entorno mínimas exigidas
- que la conexión a MySQL sea válida
- que el transporte SMTP esté configurado correctamente

Si falta alguna variable obligatoria, el servidor no arranca y muestra el error correspondiente.

## Estructura del proyecto

- `server.js`: archivo principal del backend
- `package.json`: dependencias del proyecto
- `uploads/`: carpeta de almacenamiento de archivos subidos
- `js/`: scripts del frontend y documentación adicional
- `SETUP.md`: guía de configuración del servidor
- `docs/`: documentación adicional

## Consideraciones finales

Este backend está preparado para operar como soporte de una plataforma inmobiliaria con operaciones de catálogo, gestión de archivos y atención al cliente. La implementación se orientó a minimizar riesgos de seguridad y a mantener el código claro y extensible para futuros ajustes o incremento de funcionalidades.
