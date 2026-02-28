# Refactorización - Actualización del Esquema de Base de Datos

## Resumen de Cambios
Se ha realizado una refactorización completa del código para alinearse con el nuevo esquema de base de datos MySQL.

## Cambios en Entidades de Dominio

### 1. **User.ts**
- ❌ Removido: `createdAt` (timestamp)
- ❌ Removido: `updatedAt` (timestamp)
- ✅ Agregado: `tokenGoogle?: string` (campo opcional para token de Google)
- El campo `password` se almacena cifrado (comentario de implementación)

### 2. **Activity.ts**
- ✅ Cambio de tipo: `id` de `string` a `number`
- ✅ Agregado: `idClerk: number`
- ✅ Agregado: `fechaCreacion: string`
- ❌ Removido: `createdAt` y `updatedAt`
- Método `occursOn()` actualizado para trabajar con el nuevo esquema

### 3. **ActivityDetails.ts**
- ✅ Agregado: `id: number`
- ✅ Agregado: `idActividad: number`
- ✅ Cambio de nombre: `ubicacion` → `Ubicacion` (mayúscula C)
- Constructor actualizado para requerir `id` e `idActividad`

### 4. **ActivityPriority.ts**
- ✅ Agregado: `id: number`
- ✅ Agregado: `idActividad: number`
- ✅ Cambio de nombre: `colores` → `color`
- Constructor actualizado para requerir `id` e `idActividad`

### 5. **Repetition.ts**
- ✅ Removido: Enum `DayOfWeek`
- ✅ Cambio de tipo: `diasSemana` de `DayOfWeek[]` a `string` (varchar(25) en BD)
- ✅ Agregado: `id: number`
- ✅ Agregado: `idActividad: number`
- Método `isOccurringOn()` actualizado para trabajar con string de días
- Validación: máximo 25 caracteres para `diasSemana`

### 6. **Tag.ts**
- ✅ Cambio de tipo: `id` de `string` a `number`
- ❌ Removido: `createdAt` y `updatedAt`
- Constructor simplificado sin parámetros de timestamp

## Cambios en Interfaces de Repositorio

### 1. **IActivityRepository**
- `findById(id: number)` - cambio de tipo de parámetro
- `delete(id: number)` - cambio de tipo de parámetro

### 2. **ITagRepository**
- `findById(id: number)` - cambio de tipo de parámetro
- `delete(id: number)` - cambio de tipo de parámetro

## Cambios en Casos de Uso (Application)

### CreateActivityUseCase
- ✅ Agregados parámetros: `idClerk`, `fechaCreacion`, `detailsId`, `priorityId`, `repetitionId`
- ✅ Cambio de tipo: `diasSemana` de `DayOfWeek[]` a `string`
- ✅ Removido: Import de `DayOfWeek` enum

### CreateTagUseCase
- ✅ Cambio de tipo: `id` de `string` a `number`

### UpdateTagUseCase
- ✅ Cambio de tipo: `id` de `string` a `number`
- ❌ Removido: parámetros de timestamp (`createdAt`, `updatedAt`)

### DeleteTagUseCase
- ✅ Cambio de tipo: `id` de `string` a `number`
- Validación actualizada: verificación de número en lugar de string vacío

### SearchTagsUseCase
- ✅ Cambio de tipo: `tagById(id)` de `string` a `number`

### SearchUserActivitiesUseCase
- ✅ Cambio de tipo: `activityById(id)` de `string` a `number`

### UpdateUserUseCase
- ✅ Agregado parámetro: `tokenGoogle?: string`
- ❌ Removido: parámetros de timestamp (`createdAt`, `updatedAt`)

## Cambios en Controladores (Infrastructure)

### ActivityPostController
- ✅ Agregados parámetros en request: `idClerk`, `fechaCreacion`, `detailsId`, `priorityId`, `repetitionId`
- ✅ Cambio de nombre: `ubicacion` → `Ubicacion`
- ✅ Cambio de nombre: `activity.priority.colores` → `activity.priority.color`
- ✅ Cambio de nombre: `activity.details.ubicacion` → `activity.details.Ubicacion`
- Respuestas JSON actualizadas con nuevos campos

### Cambios consistentes en todos los controladores
- Acceso correcto a nombres de propiedades con las nuevas convenciones

## Cambios en Implementaciones de Repositorio

### MySqlActivityRepository
- Tipos de parámetro actualizados: `id: number` en lugar de `string`

### MySqlTagRepository
- Tipos de parámetro actualizados: `id: number` en lugar de `string`

### MySqlUserRepository
- Sin cambios necesarios (tipos ya eran correctos)

## Mapeo de Esquema de Base de Datos

| Tabla | Campo | Tipo | Notas |
|-------|-------|------|-------|
| Usuarios | id | integer | PK |
| | correo | varchar(255) | |
| | contrasenna | varchar(255) | Cifrada con JWT |
| | nombre | varchar(255) | |
| | token_google | varchar(255) | Opcional |
| Actividades | id | integer | PK |
| | id_clerk | integer | FK |
| | id_usuario | integer | FK |
| | id_etiqueta | integer | FK |
| | fecha_creacion | varchar(255) | |
| Actividades_detalles | id | integer | PK |
| | id_actividad | integer | FK |
| | title | varchar(255) | |
| | descripcion | varchar(255) | |
| | Ubicacion | varchar(255) | |
| Repeticiones | id | integer | PK |
| | id_frecuencia | integer | FK |
| | dias_semana | varchar(25) | Ej: "MON,WED,FRI" |
| | fecha_inicio | timestamp | |
| | fecha_fin | timestamp | |
| | id_actividad | integer | FK |
| Prioridad | id | integer | PK |
| | id_actividad | integer | FK |
| | valor | varchar | Enum: CRITICAL,HIGH,MEDIUM,LOW |
| | color | varchar(7) | Ej: "#FF0000" |
| Etiquetas | id | integer | PK |
| | id_usuario | integer | FK |
| | nombre | varchar(50) | |
| | color | varchar(7) | |
| Frecuencia | id | integer | PK |
| | frecuencia | enum | |

## Validaciones Importantes

1. **ActivityDetails**: Ahora requiere `id` e `idActividad` válidos (>= 1)
2. **ActivityPriority**: Ahora requiere `id` e `idActividad` válidos (>= 1)
3. **Repetition**: 
   - Requiere `id` e `idActividad` válidos
   - `diasSemana` limitado a 25 caracteres
4. **Tag**: Cambio de validación de `id` - debe ser `>= 1` en lugar de verificar string vacío

## Próximos Pasos

1. Implementar los repositorios MySQL con consultas SQL actualizadas
2. Actualizar migraciones de BD si existen
3. Validar que todos los controladores reciban los nuevos parámetros requeridos
4. Actualizar documentación de API con nuevos campos obligatorios
5. Verificar conflictos de tipos en compilación TypeScript
