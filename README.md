# Zafiro API

Esta es la API de conexión del proyecto **Zafiro**, que sirve como conexión entre el frontend, la base de datos y la API de Google Calendar.

## Características

- ✅ Crear, leer, actualizar y eliminar actividades
- ✅ Gestión de usuarios con autenticación JWT
- ✅ Sistema de etiquetas/tags para organizar actividades
- ✅ Seguridad con JWT para proteger endpoints
- ✅ Base de datos PostgreSQL en Supabase
- ✅ Deployment en Render

## Instalación Local

```bash
# Instalar dependencias
npm install

# Encender en modo desarrollo
npm run dev
```

## Base URL

- **Local**: `http://localhost:3000`
- **Producción**: `https://zafiro-api-2.onrender.com`

---

## Endpoints (13 Total)

### 1. Health Check

Verifica si la API está funcionando.

**GET** `/health`

**Response (200)**
```json
{
  "status": "API is running"
}
```

---

## Autenticación

### 2. Registrar Usuario

Crea una nueva cuenta de usuario.

**POST** `/api/auth/register`

**Request Body**
```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "contrasenna": "MiContraseña123!"
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Usuario registrado correctamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (400)**
```json
{
  "success": false,
  "message": "El correo ya está registrado"
}
```

---

### 3. Iniciar Sesión

Ingresa con credenciales existentes.

**POST** `/api/auth/login`

**Request Body**
```json
{
  "correo": "juan@example.com",
  "contrasenna": "MiContraseña123!"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Sesión iniciada correctamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (401)**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

## Usuarios (Requieren Autenticación)

Para las siguientes rutas, incluye el token JWT en el header:
```
Authorization: Bearer <token>
```

### 4. Obtener Perfil del Usuario

**GET** `/api/users/:id`

**Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com"
  }
}
```

---

### 5. Actualizar Perfil del Usuario

**PUT** `/api/users/:id`

**Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**
```json
{
  "nombre": "Juan Carlos Pérez",
  "correo": "juan.carlos@example.com"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Usuario actualizado correctamente",
  "data": {
    "id": 1,
    "nombre": "Juan Carlos Pérez",
    "correo": "juan.carlos@example.com"
  }
}
```

---

### 6. Eliminar Usuario

**DELETE** `/api/users/:id`

**Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**
```json
{
  "success": true,
  "message": "Usuario eliminado correctamente"
}
```

  });
  await this.deleteUserUseCase.execute(id);

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}

---

## Ajustes de Usuario (Requieren Autenticación)

Gestiona la configuración personalizada de cada usuario (horarios, ocupación, etc.).

### 10. Crear Ajustes de Usuario

**POST** `/api/users/:userId/settings`

**Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**
```json
{
  "idUsuario": 1,
  "ocupacion": "Desarrollador",
  "horaInicio": 8,
  "horaFin": 17
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Ajustes de usuario creados correctamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "idUsuario": 1,
    "ocupacion": "Desarrollador",
    "horaInicio": 8,
    "horaFin": 17
  }
}
```

---

### 11. Obtener Ajustes de Usuario

**GET** `/api/users/:userId/settings`

**Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "idUsuario": 1,
    "ocupacion": "Desarrollador",
    "horaInicio": 8,
    "horaFin": 17
  }
}
```

---

### 12. Actualizar Ajustes de Usuario

**PUT** `/api/users/:userId/settings`

**Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**
```json
{
  "idUsuario": 1,
  "ocupacion": "Senior Developer",
  "horaInicio": 9,
  "horaFin": 18
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Ajustes de usuario actualizados correctamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "idUsuario": 1,
    "ocupacion": "Senior Developer",
    "horaInicio": 9,
    "horaFin": 18
  }
}
```

---

### 13. Eliminar Ajustes de Usuario

**DELETE** `/api/users/:userId/settings`

**Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**
```json
{
  "success": true,
  "message": "Ajustes de usuario eliminados correctamente",
}
```

---

### 7. Crear Actividad

**POST** `/api/calendar/activities`

**Request Body**
```json
{
  "id": "activity_001",
  "idUsuario": 1,
  "summary": "Reunión de trabajo",
  "description": "Reunión con el equipo de desarrollo",
  "location": "Oficina 301",
  "start": {
    "dateTime": "2026-03-10T10:00:00Z",
    "timeZone": "America/Bogota"
  },
  "end": {
    "dateTime": "2026-03-10T11:00:00Z",
    "timeZone": "America/Bogota"
  },
  "status": "confirmed",
  "color": "#FF5733"
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Actividad creada correctamente",
  "data": {
    "id": "activity_001",
    "idUsuario": 1,
    "summary": "Reunión de trabajo",
    "description": "Reunión con el equipo de desarrollo"
  }
}
```

---

### 8. Obtener Actividades del Usuario

**GET** `/api/calendar/activities/user/:userId`

**Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity_001",
      "idUsuario": 1,
      "summary": "Reunión de trabajo",
      "start": "2026-03-10T10:00:00Z",
      "end": "2026-03-10T11:00:00Z",
      "status": "confirmed"
    },
    {
      "id": "activity_002",
      "idUsuario": 1,
      "summary": "Capacitación",
      "start": "2026-03-11T14:00:00Z",
      "end": "2026-03-11T16:00:00Z",
      "status": "confirmed"
    }
  ]
}
```

---

### 9. Obtener Actividades por Fecha

**GET** `/api/calendar/activities/user/:userId/date/:date`

**Parámetros**
- `userId`: ID del usuario (ej: `1`)
- `date`: Fecha en formato ISO (ej: `2026-03-10`)

**Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity_001",
      "idUsuario": 1,
      "summary": "Reunión de trabajo",
      "start": "2026-03-10T10:00:00Z",
      "end": "2026-03-10T11:00:00Z"
    }
  ]
}
```

---

## Ejemplos con cURL

### Registrar Usuario
```bash
curl -X POST https://zafiro-api-2.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "contrasenna": "MiContraseña123!"
  }'
```

### Iniciar Sesión
```bash
curl -X POST https://zafiro-api-2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "juan@example.com",
    "contrasenna": "MiContraseña123!"
  }'
```

### Obtener Perfil (con token)
```bash
curl -X GET https://zafiro-api-2.onrender.com/api/users/1 \
  -H "Authorization: Bearer tu_token_aqui"
```

### Crear Actividad
```bash
curl -X POST https://zafiro-api-2.onrender.com/api/calendar/activities \
  -H "Content-Type: application/json" \
  -d '{
    "id": "activity_001",
    "idUsuario": 1,
    "summary": "Reunión de trabajo",
    "start": {
      "dateTime": "2026-03-10T10:00:00Z"
    },
    "end": {
      "dateTime": "2026-03-10T11:00:00Z"
    }
  }'
```

### Obtener Actividades del Usuario
```bash
curl -X GET https://zafiro-api-2.onrender.com/api/calendar/activities/user/1
```

### Crear Ajustes de Usuario (con token)
```bash
curl -X POST https://zafiro-api-2.onrender.com/api/users/1/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token_aqui" \
  -d '{
    "idUsuario": 1,
    "ocupacion": "Desarrollador",
    "horaInicio": 8,
    "horaFin": 17
  }'
```

### Obtener Ajustes de Usuario (con token)
```bash
curl -X GET https://zafiro-api-2.onrender.com/api/users/1/settings \
  -H "Authorization: Bearer tu_token_aqui"
```

### Actualizar Ajustes de Usuario (con token)
```bash
curl -X PUT https://zafiro-api-2.onrender.com/api/users/1/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token_aqui" \
  -d '{
    "idUsuario": 1,
    "ocupacion": "Senior Developer",
    "horaInicio": 9,
    "horaFin": 18
  }'
```

---

## Notas Importantes

- El token JWT expira en **24 horas**
- Todos los endpoints requieren el header `Content-Type: application/json`
- Para endpoints protegidos, incluye: `Authorization: Bearer <token>`
- Reemplaza `:id` y `:userId` con los valores reales
- La contraseña debe tener al menos 8 caracteres

## Stack

- **Runtime**: Node.js con TypeScript
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: JWT
- **Deployment**: Render