## Zafiro API

Backend REST en Node.js, TypeScript y Express para usuarios, actividades, etiquetas, prioridades y sincronización con Google Calendar.

## Stack

- Node.js
- TypeScript
- Express
- PostgreSQL con `pg`
- Clerk para autenticación
- Google Calendar API para integración de calendario

## Arquitectura

El proyecto está organizado por contextos y capas:

- `Domain`: entidades y contratos
- `Application`: casos de uso
- `Infrastructure`: controllers, repositorios y servicios externos

Contextos principales:

- `Users`
- `Activities`
- `Tags`
- `Priorities`
- `Shared`

## Configuración

Instalación:

```bash
npm install
```

Variables de entorno mínimas:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@host:5432/database

CLERK_SECRET_KEY=sk_test_tu_clave_clerk
CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_publica

JWT_SECRET=tu_secreto_para_state_oauth

GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar

GOOGLE_SYNC_DEFAULT_DAYS_BACK=30
GOOGLE_SYNC_DEFAULT_DAYS_FORWARD=90
```

Inicialización de base de datos:

```bash
psql -d zafiro_db -f bd/schema.sql
```

Ejecución:

```bash
npm run dev
```

## Autenticación

La API usa Clerk como única fuente de identidad.

- El frontend envía `Authorization: Bearer <ClerkToken>` en endpoints protegidos.
- La API valida el token con Clerk.
- Ya no existe JWT interno para sesión de la API.
- El usuario local se crea o sincroniza desde Clerk.

Endpoints de sesión:

- `POST /api/auth/login`
- `POST /api/auth/session`
- `POST /api/auth/register/session`

## Integración con Google Calendar

Flujo disponible:

1. El usuario se autentica con Clerk.
2. La API sincroniza o crea el usuario local.
3. El usuario conecta Google con OAuth desde la API.
4. La API guarda `access_token` y `refresh_token` de Google.
5. La API puede crear, actualizar, eliminar y sincronizar eventos con Google Calendar.

Notas importantes:

- El scope por defecto permite escritura: `https://www.googleapis.com/auth/calendar`
- La API refresca el token de Google cuando está por expirar.
- El callback de Google debe apuntar al backend.

Endpoints de Google:

- `GET /api/integrations/google/connect`
- `GET /api/integrations/google/callback`
- `POST /api/integrations/google/sync`
- `GET /api/integrations/google/status`
- `GET /api/integrations/google/events`
- `DELETE /api/integrations/google/disconnect`

## Endpoints principales

Health:

- `GET /health`

Usuarios:

- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

Ajustes de usuario:

- `POST /api/users/:userId/settings`
- `GET /api/users/:userId/settings`
- `PUT /api/users/:userId/settings`
- `DELETE /api/users/:userId/settings`

Actividades:

- `POST /api/calendar/activities`
- `POST /api/activities`
- `GET /api/activities/:id`
- `PUT /api/activities/:id`
- `PATCH /api/activities/:id`
- `DELETE /api/activities/:id`
- `GET /api/calendar/activities/user/:userId`
- `GET /api/activities/user/:userId`
- `GET /api/calendar/activities/user/:userId/date/:date`
- `GET /api/activities/user/:userId/date/:date`
- `GET /api/calendar/activities/me`
- `GET /api/calendar/activities/me/range?from=<ISO>&to=<ISO>`

Etiquetas:

- `POST /api/tags`
- `GET /api/tags/user/:userId`
- `GET /api/tags/:id`
- `PUT /api/tags/:id`
- `DELETE /api/tags/:id`

Prioridades:

- `POST /api/priorities`
- `GET /api/priorities/user/:userId`
- `GET /api/priorities/:id`
- `GET /api/priorities/activity/:activityId`
- `PUT /api/priorities/:id`
- `DELETE /api/priorities/:id`

## Actividades

Reglas actuales del backend:

- `idUsuario` no se acepta en el body de create o update.
- El usuario se resuelve siempre desde el token autenticado.
- Las rutas de actividades ya no son públicas.
- Solo el dueño de la actividad puede consultar, actualizar o eliminar.

Comportamiento con Google Calendar:

- `POST /api/activities`: crea en BD local y, si el usuario tiene Google conectado, crea también el evento remoto.
- `PUT /api/activities/:id` y `PATCH /api/activities/:id`: actualizan localmente y sincronizan el cambio a Google.
- `DELETE /api/activities/:id`: elimina localmente y borra el evento remoto si existe `google_event_id`.

Campos mínimos para crear o actualizar actividad:

```json
{
  "summary": "Reunion",
  "start": {
    "dateTime": "2026-03-15T10:00:00-06:00",
    "timeZone": "America/Mexico_City"
  },
  "end": {
    "dateTime": "2026-03-15T11:00:00-06:00",
    "timeZone": "America/Mexico_City"
  }
}
```

Campos soportados adicionales:

- `description`
- `location`
- `status`
- `recurrence`
- `reminders`
- `idEtiqueta`
- `tiempoDescansoMin`
- `tiempoMuertoMin`
- `prioridadValor`

## Estado actual

Cambios ya aplicados en el backend:

- autenticación Clerk-only
- eliminación del legado de contraseña
- cierre de rutas públicas de actividades
- bloqueo de `idUsuario` arbitrario en body
- create, update, patch y delete de actividades con sincronización hacia Google Calendar

## Verificación

Comando recomendado después de cambios:

```bash
npx tsc --noEmit
```
*** Add File: c:\Users\chema\Desktop\Zafiro_code\Zafiro_API_2\README.STEP1.md
# Paso 1 - Migracion a Clerk-only en Auth y Users

Fecha de ejecucion: 2026-03-14

## Objetivo

Dejar la autenticacion del backend alineada con Clerk como unica fuente de identidad y eliminar la dependencia del JWT interno y de la contrasenna local en el flujo de usuarios.

## Cambios realizados

- `AuthMiddleware` ahora valida exclusivamente el token Bearer con Clerk.
- `LoginUserUseCase` ya no genera JWT interno ni soporta login por correo/contrasenna.
- `User` y `IUserRepository` quedaron sin campo `password` ni `passwordHash`.
- `MySqlUserRepository` fue alineado con la tabla `usuarios` sin columna `contrasenna`.
- `AuthController` ya no devuelve `token` en `login`, `loginSession` y `registerSession`.
- `UpdateUserUseCase` y `AuthController.update()` dejaron de manejar contrasenna.
- La firma del `state` de Google OAuth ahora exige secreto configurado en entorno.

## Impacto esperado en frontend

- El frontend debe seguir enviando `Authorization: Bearer <ClerkToken>`.
- Ya no debe esperar `token` propio de la API en las respuestas de sesion.
- El alta o sincronizacion del usuario ocurre a traves de `POST /api/auth/session` o `POST /api/auth/register/session`.

## Avance adicional - Seguridad y Activities

- Se cerraron rutas publicas de actividades.
- Se bloqueo el envio de `idUsuario` arbitrario en el body.
- Se agrego sincronizacion de create, update, patch y delete de actividades hacia Google Calendar.
- El scope por defecto de Google OAuth subio a `https://www.googleapis.com/auth/calendar`.