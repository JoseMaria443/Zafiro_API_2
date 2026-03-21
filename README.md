## Zafiro API

API REST construida con Node.js, TypeScript y Express para gestionar usuarios, actividades, etiquetas, prioridades e integración con Google Calendar.

**Documentación de Testing**: Lee [TESTING.md](./TESTING.md) para instrucciones detalladas de pruebas con Postman e integración.

## Stack

- Node.js 18+
- TypeScript 5.9+
- Express 5.2+
- PostgreSQL (pg 8.19+)
- Clerk (autenticación) - Opcional con AUTH_BYPASS_ENABLED
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

## 🧪 Testing

### Opción 1: Postman (Recomendado para desarrollo)

1. **Importar colección:**
   - Abre **Postman**
   - Haz clic en **Import**
   - Carga: `postman/Zafiro_API.postman_collection.json`
   - Carga ambiente: `postman/Zafiro_API.local.postman_environment.json`

2. **Ejecutar pruebas:**
   ```bash
   # Con Newman (CLI de Postman)
   npm install -g newman
   ./test.sh postman  # O .\test.ps1 -mode postman (Windows)
   ```

3. **O manualmente en Postman:**
   - Selecciona ambiente: **Zafiro API - Local**
   - Ejecuta requests en orden (auth → activities → tags → etc)
   - Verifica respuestas y tests en cada request

**Documentación completa**: [TESTING.md](./TESTING.md)

### Opción 2: Integration Tests (Jest)

```bash
# Ejecutar tests
npm test

# O con script
./test.sh integration  # Mac/Linux
.\test.ps1 -mode integration  # Windows

# Con coverage
npm test -- --coverage
```

### Opción 3: Ambos modos

```bash
./test.sh all        # Mac/Linux - ejecuta Postman + Integration
.\test.ps1 all       # Windows
```




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
