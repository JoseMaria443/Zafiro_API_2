# Adaptación a Google Calendar API

## Cambios de Integración con Google Calendar

Se ha modificado la estructura de datos para alinearse con los eventos que retorna la API de Google Calendar.

### Mapeo de Campos Google Calendar → Zafiro API

| Google Calendar | Zafiro API | Tipo | Notas |
|---|---|---|---|
| `id` | `Activity.id` | string | ID único del evento en Google |
| `summary` | `ActivityDetails.summary` | string | Título del evento |
| `description` | `ActivityDetails.description` | string? | Descripción (opcional) |
| (no aplica) | `ActivityDetails.location` | string? | Ubicación (opcional, no siempre en Google Calendar) |
| `start.dateTime` \| `start.date` | `Activity.start` | `EventDateTime` | Fecha/hora de inicio |
| `end.dateTime` \| `end.date` | `Activity.end` | `EventDateTime` | Fecha/hora de fin |
| `created` | `Activity.created` | string | Timestamp de creación |
| `updated` | `Activity.updated` | string | Timestamp de última actualización |
| `status` | `Activity.status` | string | Estado del evento (ej: "confirmed") |
| `recurringEventId` | `Activity.recurringEventId` | string? | ID del evento recurrente base |
| (creator.email) | `Activity.idUsuario` | number | ID del usuario en BD |
| No mapeado | `Activity.idEtiqueta` | number? | Para categorización local |

### Cambios en Entidades

#### **Activity.ts**
```typescript
// Antes
id: number (generado localmente)
idClerk: number
idUsuario: number
idEtiqueta: number (requerido)
fechaCreacion: string
details: ActivityDetails
priority: ActivityPriority
repetition: Repetition

// Después
id: string (de Google Calendar)
idUsuario: number
idEtiqueta?: number (opcional)
summary: string
start: EventDateTime
end: EventDateTime
created: string
updated: string
recurringEventId?: string
status: string
details: ActivityDetails
priority?: ActivityPriority (opcional)
repetition?: Repetition (opcional)
```

#### **ActivityDetails.ts**
```typescript
// Antes
title: string (requerido)
descripcion: string (requerido)
Ubicacion: string (requerido)

// Después
summary: string (requerido, mapea a ActivityDetails)
description?: string (opcional)
location?: string (opcional)
```

#### **EventDateTime Interface (Nueva)**
```typescript
export interface EventDateTime {
  dateTime?: string;  // RFC 3339 format: "2026-02-21T05:30:00-06:00"
  date?: string;      // ISO 8601 format: "2026-03-01"
  timeZone?: string;  // Ej: "America/Mexico_City"
}
```

### Protocolo de Ingesta de Eventos de Google Calendar

#### 1. **Eventos con Hora (dateTime)**
```json
{
  "id": "4iast8mectuf236sk2fj352ebt_20260221T113000Z",
  "summary": "cvdfdvferf",
  "start": {
    "dateTime": "2026-02-21T05:30:00-06:00",
    "timeZone": "America/Mexico_City"
  },
  "end": {
    "dateTime": "2026-02-21T07:00:00-06:00",
    "timeZone": "America/Mexico_City"
  },
  "created": "2026-02-15T04:31:12.000Z",
  "updated": "2026-02-25T00:28:02.602Z",
  "status": "confirmed",
  "recurringEventId": "4iast8mectuf236sk2fj352ebt"
}
```

Se mapea como:
- `Activity.start.dateTime` = "2026-02-21T05:30:00-06:00"
- `Activity.end.dateTime` = "2026-02-21T07:00:00-06:00"
- `Activity.created` = "2026-02-15T04:31:12.000Z"
- `Activity.updated` = "2026-02-25T00:28:02.602Z"

#### 2. **Eventos sin Hora (date)**
```json
{
  "id": "6u78pckro82i9umtb1d5fr6vs6",
  "summary": "inicio de vacaciones de semana santa",
  "start": {
    "date": "2026-03-01"
  },
  "end": {
    "date": "2026-03-02"
  },
  "created": "2026-02-15T02:23:58.000Z",
  "updated": "2026-02-15T02:23:58.496Z",
  "status": "confirmed"
}
```

Se mapea como:
- `Activity.start.date` = "2026-03-01"
- `Activity.end.date` = "2026-03-02"

### Cambios en Casos de Uso

#### **CreateActivityUseCase**
- Ya no requiere todos los parámetros relacionados con prioridad y repetición
- `priority` y `repetition` son opcionales

```typescript
// Parámetros opcionales en CreateActivityRequest
priorityId?: number;
prioridad?: PriorityLevel;
color?: string;
repetitionId?: number;
idFrecuencia?: number;
diasSemana?: string;
fechaInicio?: Date;
fechaFin?: Date;
```

#### **SearchUserActivitiesUseCase**
- Ahora `activityById` acepta `id: string` en lugar de `number`

### Cambios en Controladores

#### **ActivityPostController**

**POST /activities/create**
```json
{
  "id": "4iast8mectuf236sk2fj352ebt_20260221T113000Z",
  "idUsuario": 1,
  "summary": "cvdfdvferf",
  "start": {
    "dateTime": "2026-02-21T05:30:00-06:00",
    "timeZone": "America/Mexico_City"
  },
  "end": {
    "dateTime": "2026-02-21T07:00:00-06:00",
    "timeZone": "America/Mexico_City"
  },
  "created": "2026-02-15T04:31:12.000Z",
  "updated": "2026-02-25T00:28:02.602Z",
  "status": "confirmed",
  "detailsId": 1,
  "description": "Descripción opcional",
  "location": "Ubicación opcional",
  "recurringEventId": "4iast8mectuf236sk2fj352ebt"
}
```

**GET /activities/user/:userId**
Retorna eventos con estructura de Google Calendar

**GET /activities/user/:userId/date/:date**
Retorna eventos de una fecha específica

### Flujo de Sincronización Recomendado

1. **Obtener eventos de Google Calendar API**
2. **Transformar campos** (summary → ActivityDetails.summary, etc.)
3. **Validar campos obligatorios** (id, idUsuario, summary, start, end, created, updated, status)
4. **Crear Activity con EventDateTime**
5. **Almacenar en base de datos**

### Validaciones Actualizadas

**Activity Constructor** ahora valida:
- `id` no vacío (es string)
- `idUsuario` >= 1
- `summary` no vacío
- `start` tiene `dateTime` o `date`
- `end` tiene `dateTime` o `date`
- `created` no vacío
- `updated` no vacío
- `status` no vacío

**ActivityDetails Constructor** ahora solo requiere:
- `summary` no vacío
- `id` >= 1
- `idActividad` >= 1

### Cambios en Repositorios

**MySqlActivityRepository**
- `findById(id: string)` - ahora recibe ID de Google
- `delete(id: string)` - ahora usa ID de Google
- Las demás operaciones permanecen igual

## Ejemplo de Implementación de Sincronización

```typescript
// Pseudo-código
async function syncGoogleCalendarEvents(userId: number, googleEvents: any[]) {
  for (const googleEvent of googleEvents) {
    const activity = new Activity(
      googleEvent.id,                    // id string
      userId,                            // idUsuario
      googleEvent.summary,               // summary
      {
        dateTime: googleEvent.start.dateTime,
        date: googleEvent.start.date,
        timeZone: googleEvent.start.timeZone
      },
      {
        dateTime: googleEvent.end.dateTime,
        date: googleEvent.end.date,
        timeZone: googleEvent.end.timeZone
      },
      googleEvent.created,               // created
      googleEvent.updated,               // updated
      googleEvent.status,                // status
      new ActivityDetails(
        1,                               // id (puede ser autogenerado)
        parseInt(googleEvent.id),        // idActividad
        googleEvent.summary,             // summary
        googleEvent.description,         // description (opcional)
        googleEvent.location             // location (opcional)
      ),
      undefined,                         // idEtiqueta (opcional)
      googleEvent.recurringEventId       // recurringEventId
    );

    await activityRepository.save(activity);
  }
}
```

## Próximos Pasos

1. Implementar servicio de sincronización con Google Calendar API
2. Crear endpoint para webhook de cambios en Google Calendar
3. Validar y transformar eventos de Google Calendar antes de guardar
4. Implementar manejo de eventos recurrentes (`recurringEventId`)
5. Gestionar conflictos de actualización entre local y Google Calendar
