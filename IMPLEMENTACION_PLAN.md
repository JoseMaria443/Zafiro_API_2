# Plan de Implementación: API Funcional con Nuevo Schema

## Estado Actual vs. Objetivo

### Problemas Detectados en API Actual:
1. **AuthController**: usa JWT propios, no Clerk
2. **Repo user**: espera IDs enteros, pero schema nuevo usa UUID
3. **CreateActivity**: solo guarda `id_clerk`, `id_etiqueta`, `id_usuario`, `fecha_creacion` → falta `prioridad`, `tiempo_descanso`, `tiempo_muerto`, fechas/horas correctas
4. **UserSettingsController**: no está mapeado al "_segundo_ formulario post-login"
5. **Schema nuevo**: tiene campos de Google Calendar que API no maneja aún

---

## Cambios Prioritarios (Fase 1 - Mínimo Viable)

### 1. **AuthController** → Integrar Clerk
**Archivo**: `src/Contexts/API/Users/Infrastructure/Controllers/AuthController.ts`
```
- login() ahora recibe clerk_user_id (token Clerk)
  - Validar token con Clerk backend
  - Si usuario existe → devolver con ajustes (ocupacion, hora_inicio, hora_fin)
  - Si NO existe → registrarlo y pedir formulario de ajustes_usuario (segundo paso)
```

### 2. **Repositorio User** → UUID y clerk_user_id
**Archivo**: `src/Contexts/API/Users/Infrastructure/Persistence/MySqlUserRepository.ts`
```
- Cambiar IDs de INT a UUID
- Agregar buscar por clerk_user_id
- Guardar clerk_user_id, correo, nombre (del Clerk, no editable)
```

### 3. **ActivityPostController** → Agregar Prioridad y RF-03
**Archivo**: `src/Contexts/API/Activities/Infrastructure/Controllers/ActivityPostController.ts`
```
POST /api/calendar/activities ahora acepta:
{
  id_usuario: UUID,
  title: string,
  descripcion: string,
  ubicacion: string,
  fecha_inicio: DATE,
  fecha_fin: DATE,
  hora_inicio: TIME,
  hora_fin: TIME,
  tiempo_descanso_min: number,
  tiempo_muerto_min: number,
  prioridad: { valor: 'baja' | 'media' | 'alta', color: string },
  frecuencia: { id_frecuencia: int, dias_semana: string },
  id_etiqueta?: int
}
```

### 4. **UserSettingsController** → Formulario Post-Login
**Archivo**: `src/Contexts/API/Users/Infrastructure/Controllers/UserSettingsController.ts`
```
POST /api/users/:userId/settings 
- SOLO acepta: ocupacion
- IGNORA/RECHAZA: hora_inicio, hora_fin (system-managed)
- Validar que es la primera vez (UNIQUE constraint en BD)

PUT /api/users/:userId/settings
- SOLO permite editar: ocupacion
- ho

ra_inicio/hora_fin NO son editables
```

### 5. **MySqlActivityRepository** → RF-03 Completo
**Archivo**: `src/Contexts/API/Activities/Infrastructure/Persistence/MySqlActivityRepository.ts`
```
- Guardar tiempo_descanso_min, tiempo_muerto_min
- Guardar fecha_inicio, fecha_fin, hora_inicio, hora_fin
- Insertar prioridad.valor con ENUM (baja/media/alta)
- Mapear en SELECT para devolver datos completos
```

---

## Cambios Secundarios (Fase 2 - Cuando Google esté listo)

- Tabla `user_google_connections`: rellenar en endpoint `/api/integrations/google/callback`
- Tabla `user_google_sync_state`: actualizar en job de sincronización
- Campos `source`, `status`, `google_event_id` en actividades: rellenar solo en sync desde Google

---

## Orden de Ejecución Recomendado

1. **Actualizar MySqlUserRepository** (UUID + clerk_user_id)
2. **Actualizar AuthController** (Clerk login)
3. **Actualizar MySqlActivityRepository** (RF-03 fields + prioridad)
4. **Actualizar ActivityPostController** (nuevo body)
5. **Actualizar UserSettingsController** (formulario post-login, solo ocupacion editable)
6. **Actualizar app.ts rutas** si es necesario

---

## Archivos a Modificar

```
src/Contexts/API/Users/
  ├── Infrastructure/Controllers/
  │   ├── AuthController.ts ⚠️ Prioridad 1
  │   └── UserSettingsController.ts ⚠️ Prioridad 2
  ├── Infrastructure/Persistence/
  │   └── MySqlUserRepository.ts ⚠️ Prioridad 1
  └── Application/
      ├── RegisterUser.ts
      ├── LoginUser.ts
      └── ...

src/Contexts/API/Activities/
  ├── Infrastructure/Controllers/
  │   └── ActivityPostController.ts ⚠️ Prioridad 2
  └── Infrastructure/Persistence/
      └── MySqlActivityRepository.ts ⚠️ Prioridad 1

src/app.ts
  └── (posibles cambios en rutas)
```

---

## Notas Importantes

- **Compatibilidad**: El schema acepta `id_clerk` VARCHAR(255) para compatibilidad temporal con API actual
- **Transición Clerk**: Por ahora, AuthController puede validar `clerk_user_id` como string (cuando se integre Clerk de verdad)
- **Prioridad.valor**: Usar ENUM SQL (baja/media/alta) en lugar de VARCHAR
- **Ajustes Usuario**: Solo `ocupacion` editable; `hora_inicio/hora_fin` son read-only (fijo en auth response)
