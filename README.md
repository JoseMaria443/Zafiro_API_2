## Zafiro API

API REST construida con Node.js, TypeScript y Express para gestionar usuarios, actividades, etiquetas, prioridades e integración con Google Calendar.

## Stack

- Node.js
- TypeScript
- Express
- PostgreSQL (pg)
- Clerk (autenticación)
- Google Calendar API

## Arquitectura

La solución sigue una estructura por contextos y capas:

- Domain: entidades y contratos
- Application: casos de uso
- Infrastructure: controladores, repositorios e integraciones

Contextos principales:

- Users
- Activities
- Tags
- Priorities
- Shared

## Configuración local

1. Instalar dependencias

npm install

2. Variables de entorno mínimas

PORT=3000
NODE_ENV=development

# Opcional para pruebas locales sin token de Clerk (NO usar en producción)
AUTH_BYPASS_ENABLED=true
AUTH_BYPASS_CLERK_USER_ID=tu-clerk-user-id-existente
AUTH_BYPASS_EMAIL=test@local.dev
AUTH_BYPASS_NAME=Usuario de prueba

# También puedes sobreescribir por request con headers:
# x-test-clerk-user-id, x-test-user-email, x-test-user-name

4. Levantar el servidor

npm run dev


## Endpoints importantes

### Salud

- GET /health

### Sesión y autenticación

- POST /api/auth/session
- POST /api/auth/register/session

### Usuarios

- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id

### Ajustes de usuario

- POST /api/users/:userId/settings
- GET /api/users/:userId/settings
- PATCH /api/users/:userId/settings
- DELETE /api/users/:userId/settings

### Actividades

- POST /api/activities
- GET /api/activities/me
- GET /api/activities/me/range?from=ISO&to=ISO
- GET /api/activities/user/:userId
- GET /api/activities/user/:userId/date/:date
- GET /api/activities/:id
- PATCH /api/activities/:id
- DELETE /api/activities/:id

### Etiquetas

- POST /api/tags
- GET /api/tags/me
- GET /api/tags/user/:userId
- GET /api/tags/:id
- PATCH /api/tags/:id
- DELETE /api/tags/:id

### Prioridades

- POST /api/priorities
- GET /api/priorities/user/:userId
- GET /api/priorities/activity/:activityId
- GET /api/priorities/:id
- PATCH /api/priorities/:id
- DELETE /api/priorities/:id

### Integración con Google Calendar

- GET /api/integrations/google/connect
- GET /api/integrations/google/callback
- POST /api/integrations/google/sync
- GET /api/integrations/google/status
- GET /api/integrations/google/events
- DELETE /api/integrations/google/disconnect

## Reglas importantes de negocio (Actividades)

- idUsuario no se acepta en create/update por body.
- El usuario autenticado se toma del token.
- Las rutas de actividades están protegidas.
- Si existe conexión activa con Google, create/update/delete sincronizan evento remoto.


## Objetivo

Dejar la autenticacion del backend alineada con Clerk como unica fuente de identidad y eliminar la dependencia del JWT interno y de la contrasenna local en el flujo de usuarios.
