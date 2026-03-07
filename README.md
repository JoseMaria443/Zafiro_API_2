# Zafiro API

API REST con Node.js + TypeScript + Express para gestión de actividades y usuarios.

## Stack

- **Runtime**: Node.js
- **Lenguaje**: TypeScript
- **Framework**: Express.js
- **Base de datos**: PostgreSQL (Supabase)
- **Autenticación**: Clerk

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env` con:

```env
DATABASE_URL=tu_conexion_postgresql
CLERK_SECRET_KEY=tu_clave_clerk
JWT_SECRET=tu_secreto_jwt
PORT=3000
```

## Desarrollo

```bash
npm run dev
```

## Scripts

- `npm run dev` - Servidor en modo desarrollo
- `npm start` - Servidor en producción
2. La API debe obtener eventos de Google Calendar para ese usuario.
3. La API debe guardar o actualizar esos eventos en la BD local.
4. El frontend debe seguir consultando las rutas actuales y ver datos sincronizados.

## Variables de entorno

Actualmente ya tienes rutas de Clerk en `.env`:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/calendar`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/calendar`

Esas variables son de frontend. Para completar la implementacion backend, define tambien variables privadas en `.env`:

- `CLERK_SECRET_KEY` (validacion backend con Clerk).
- `CLERK_PUBLISHABLE_KEY` (opcional para consistencia de entorno).
- `GOOGLE_CLIENT_ID`.
- `GOOGLE_CLIENT_SECRET`.
- `GOOGLE_REDIRECT_URI` (callback OAuth del backend).
- `GOOGLE_CALENDAR_SCOPES` (ejemplo: lectura de calendario y profile/email).
- `GOOGLE_SYNC_DEFAULT_DAYS_BACK` (rango inicial de importacion).
- `GOOGLE_SYNC_DEFAULT_DAYS_FORWARD`.
- `ENCRYPTION_KEY` (si vas a cifrar tokens en BD).

Notas importantes de seguridad:

- No publiques secretos reales en el repositorio.
- Rota las credenciales que ya hayan sido expuestas.

## Flujo recomendado de autenticacion y vinculacion

### 1. Login principal con Clerk

- El frontend autentica con Clerk.
- El frontend envia el token de Clerk en `Authorization: Bearer <token>` a la API.
- La API valida ese token con Clerk en un middleware nuevo (reemplazando o conviviendo con JWT actual durante migracion).

### 2. Vincular Google Calendar (OAuth)

- Usuario autenticado con Clerk llama una ruta tipo `connect/google/start`.
- La API redirige a Google OAuth consent screen.
- Google retorna al callback configurado en `GOOGLE_REDIRECT_URI`.
- La API guarda `access_token`, `refresh_token`, expiracion y alcance asociado al usuario de Clerk.

### 3. Sincronizacion inicial

- Al completar callback, ejecutar una importacion inicial de eventos (ventana configurable de fechas).
- Insertar/actualizar eventos en tablas locales.
- Responder al frontend con estado de sincronizacion para que muestre calendario local de inmediato.

### 4. Sincronizacion recurrente

- Ejecutar sincronizacion bajo demanda (por ejemplo, al abrir calendario) o por job programado.
- Renovar `access_token` con `refresh_token` cuando expire.
- Aplicar estrategia idempotente para no duplicar actividades.

## Diseno de datos recomendado

Tu schema actual incluye:

- `usuarios` (ya existe `token_google`, pero se queda corto para refresh/expiracion).
- `actividades` (`id_clerk`, `id_usuario`, etc.).
- `actividades_detalles`, `repeticiones`, `prioridad`.

Recomendaciones de modelo:

1. Mantener `usuarios` como entidad local y agregar relacion estable con Clerk:
- campo sugerido: `clerk_user_id` (texto unico).

2. Crear tabla de credenciales Google por usuario (recomendado):
- `user_google_connections` con `user_id`, `google_email`, `access_token`, `refresh_token`, `expires_at`, `scope`, `created_at`, `updated_at`.
- cifrar `access_token` y `refresh_token` en reposo.

3. En `actividades`, persistir identificador externo de Google para upsert:
- campo sugerido: `google_event_id` (unico por usuario/calendario).

4. Guardar metadata de sincronizacion:
- `last_synced_at`, `sync_source` (`google` o `local`), `google_calendar_id`.

## Mapeo de Google Event -> modelo Zafiro

Mapeo sugerido para importacion:

- `googleEvent.id` -> `actividades.google_event_id`.
- `googleEvent.summary` -> `actividades_detalles.title`.
- `googleEvent.description` -> `actividades_detalles.descripcion`.
- `googleEvent.location` -> `actividades_detalles.ubicacion`.
- `googleEvent.created` -> `actividades.fecha_creacion`.
- `googleEvent.start/end` -> estructura de dominio `Activity.start` y `Activity.end`.
- `googleEvent.status` -> estado local (por ejemplo `confirmed`, `cancelled`).

Reglas:

- Si ya existe `google_event_id` para el usuario: actualizar.
- Si no existe: insertar.
- Si Google marca `cancelled`: decidir si borrado logico o estado cancelado local.

## Endpoints sugeridos para la implementacion

Sin romper el frontend actual, agrega endpoints de integracion:

- `GET /api/integrations/google/connect`
- `GET /api/integrations/google/callback`
- `POST /api/integrations/google/sync`
- `GET /api/integrations/google/status`
- `DELETE /api/integrations/google/disconnect`

Y mantener los endpoints ya existentes para lectura de actividades:

- `GET /api/calendar/activities/user/:userId`
- `GET /api/calendar/activities/user/:userId/date/:date`

## Orden de implementacion (sin codigo)

1. Preparar secretos y configuracion OAuth en Google Cloud Console.
2. Incorporar middleware de autenticacion Clerk en backend.
3. Mapear `clerk_user_id` <-> usuario local en BD.
4. Crear flujo `connect/callback` para Google.
5. Persistir credenciales Google de forma segura.
6. Implementar importacion inicial de eventos (upsert por `google_event_id`).
7. Exponer endpoint manual de `sync`.
8. Ajustar consultas para devolver actividades sincronizadas en rutas actuales.
9. Agregar logs de auditoria y manejo de errores de OAuth/tokens.
10. Probar escenarios completos de punta a punta.

## Casos de prueba funcionales

Checklist minimo:

- Usuario inicia sesion con Clerk y API valida token correctamente.
- Usuario conecta Google y callback guarda credenciales.
- Usuario con eventos previos en Google ve esos eventos en BD local tras sync.
- `GET /api/calendar/activities/user/:userId` devuelve eventos importados.
- Re-sync no duplica eventos existentes.
- Evento cancelado en Google se refleja correctamente en la API.
- Token expirado se renueva con `refresh_token`.
- Usuario desconectado de Google deja de sincronizar.

## Riesgos y decisiones tecnicas

- Migracion JWT -> Clerk: definir si sera inmediata o gradual.
- Compatibilidad de ids: `id_usuario` (UUID local) vs `clerk_user_id` (string externo).
- Timezones: normalizar en UTC en BD y convertir en frontend.
- Privacidad: cifrado de tokens y politicas de rotacion.
- Concurrencia: evitar sync simultaneas por el mismo usuario.

## Estructura donde encaja en este repositorio

Puntos de integracion sugeridos (sin crear codigo aun):

- Middleware autenticacion: `src/Contexts/Shared/Infrastructure/Middleware/`
- Casos de uso de sincronizacion: `src/Contexts/API/Activities/Application/`
- Repositorios de persistencia: `src/Contexts/API/Activities/Infrastructure/Persistence/`
- Nuevos controladores de integracion: `src/Contexts/API/Users/Infrastructure/Controllers/` o modulo `Integrations`.

## Comandos actuales del proyecto

```bash
npm install
npm run dev
```

Base local esperada:

- `http://localhost:3000`

## Resumen

Con este plan, mantienes tus rutas actuales para el frontend y agregas una capa de integracion para:

- autenticar usuarios con Clerk,
- conectar Google Calendar,
- importar actividades existentes,
- y reflejarlas en base de datos para que el frontend las consuma de inmediato.

Esta guia esta lista para ejecutar la implementacion por fases en backend, sin cambios de frontend.

