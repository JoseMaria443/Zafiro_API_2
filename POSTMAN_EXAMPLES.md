# Ejemplos de Endpoints - Zafiro API

**Base URL:** `http://localhost:3000`  
**Base de Datos:** PostgreSQL (localhost:5432/zafiro)

## 📋 Tabla de Contenidos
- [Endpoints de Usuarios](#-endpoints-de-usuarios)
- [Health Check](#-endpoint-de-health-check)
- [Estructura de Base de Datos](#️-estructura-de-la-base-de-datos)
- [Ejemplos de Prueba](#-ejemplos-de-prueba-en-postman)
- [Errores Comunes](#️-errores-comunes)

---

## 🚀 Inicio Rápido

**Campos principales de la API:**
- `correo`: Email del usuario
- `contrasenna`: Contraseña (mínimo 8 caracteres) ⚠️ **Nota:** Se usa `contrasenna` (con 'n'), no `password`
- `nombre`: Nombre completo

**Endpoints disponibles:**
```
POST   /api/auth/register    - Registrar usuario
POST   /api/auth/login       - Iniciar sesión
GET    /api/users/:id        - Obtener usuario
PUT    /api/users/:id        - Actualizar usuario
DELETE /api/users/:id        - Eliminar usuario
GET    /health               - Estado del servidor
```

---

## 🔐 Endpoints de Usuarios

### 1. Registrar Usuario (POST)
**URL:** `http://localhost:3000/api/auth/register`  
**Método:** POST  
**Headers:**
```
Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "correo": "usuario@ejemplo.com",
  "contrasenna": "password123",
  "nombre": "Juan Pérez"
}
```
**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado correctamente",
  "data": {
    "id": 1,
    "correo": "usuario@ejemplo.com",
    "nombre": "Juan Pérez"
  }
}
```

---

### 2. Iniciar Sesión (POST)
**URL:** `http://localhost:3000/api/auth/login`  
**Método:** POST  
**Headers:**
```
Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "correo": "usuario@ejemplo.com",
  "contrasenna": "password123"
}
```
**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión iniciada correctamente",
  "data": {
    "id": 1,
    "correo": "usuario@ejemplo.com",
    "nombre": "Juan Pérez"
  }
}
```

---

### 3. Obtener Usuario por ID (GET)
**URL:** `http://localhost:3000/api/users/1`  
**Método:** GET  
**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "correo": "usuario@ejemplo.com",
    "nombre": "Juan Pérez"
  }
}
```

---

### 4. Actualizar Usuario (PUT)
**URL:** `http://localhost:3000/api/users/1`  
**Método:** PUT  
**Headers:**
```
Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "nombre": "Juan Pérez Actualizado",
  "contrasenna": "newpassword123"
}
```
**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Usuario actualizado correctamente",
  "data": {
    "id": 1,
    "correo": "usuario@ejemplo.com",
    "nombre": "Juan Pérez Actualizado"
  }
}
```

---

### 5. Eliminar Usuario (DELETE)
**URL:** `http://localhost:3000/api/users/1`  
**Método:** DELETE  
**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Usuario eliminado correctamente"
}
```

---

## ✅ Endpoint de Health Check

### Health Check (GET)
**URL:** `http://localhost:3000/health`  
**Método:** GET  
**Respuesta exitosa (200):**
```json
{
  "status": "API is running"
}
```

---

## 📝 Notas Importantes

### Validaciones:
- **Correo:** Debe ser un email válido
- **contrasenna:** Mínimo 8 caracteres
- **Nombre:** No puede estar vacío

### Códigos de Estado HTTP:
- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Petición incorrecta (validación fallida)
- `401` - No autorizado (credenciales incorrectas)
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

### Probar en Postman:
1. Abre Postman
2. Crea una nueva petición
3. Selecciona el método HTTP correspondiente (GET, POST, PUT, DELETE)
4. Pega la URL
5. Si es POST o PUT, ve a la pestaña "Body", selecciona "raw" y elige "JSON"
6. Pega el JSON de ejemplo
7. Haz clic en "Send"

### Flujo de Prueba Recomendado:
1. **Health Check** - Verificar que el servidor esté corriendo
2. **Registrar Usuario** - Crear un nuevo usuario
3. **Login** - Iniciar sesión con ese usuario
4. **Obtener Usuario** - Ver la información del usuario
5. **Actualizar Usuario** - Modificar datos del usuario
6. **Eliminar Usuario** (opcional) - Eliminar el usuario de prueba

---

## 🗃️ Estructura de la Base de Datos

### Tabla: usuarios
Los campos que acepta la API coinciden con la base de datos PostgreSQL:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER (auto) | ID generado automáticamente |
| correo | VARCHAR(255) | Email del usuario (único) |
| contrasenna | VARCHAR(255) | Contraseña del usuario |
| nombre | VARCHAR(255) | Nombre completo del usuario |
| token_google | VARCHAR(255) | Token de Google (opcional) |

---

## 🧪 Ejemplos de Prueba en Postman

### Ejemplo Completo: Flujo de Usuario

#### 1. Registro
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "correo": "maria.lopez@test.com",
  "contrasenna": "MiPassword123",
  "nombre": "María López"
}
```

#### 2. Login con el usuario creado
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "correo": "maria.lopez@test.com",
  "contrasenna": "MiPassword123"
}
```
**Guarda el `id` de la respuesta para los siguientes pasos**

#### 3. Consultar el usuario (reemplaza `1` con el ID obtenido)
```bash
GET http://localhost:3000/api/users/1
```

#### 4. Actualizar el usuario
```bash
PUT http://localhost:3000/api/users/1
Content-Type: application/json

{
  "nombre": "María López García",
  "contrasenna": "NuevaPassword456"
}
```

#### 5. Verificar que se actualizó (login con nueva contraseña)
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "correo": "maria.lopez@test.com",
  "contrasenna": "NuevaPassword456"
}
```

---

## ⚠️ Errores Comunes

### Error: "El correo ya está registrado"
**Causa:** Intentas registrar un correo que ya existe en la base de datos.  
**Solución:** Usa un correo diferente o elimina el usuario existente.

### Error: "Correo o contraseña inválidos"
**Causa:** Las credenciales no coinciden.  
**Solución:** Verifica que el correo y la contraseña sean correctos.

### Error: "La contraseña debe tener al menos 8 caracteres"
**Causa:** El campo `contrasenna` tiene menos de 8 caracteres.  
**Solución:** Usa una contraseña de 8 o más caracteres.

### Error: "Cannot destructure property 'correo' of 'req.body' as it is undefined"
**Causa:** El body no se está enviando correctamente.  
**Solución:** 
- Verifica que en Postman tengas seleccionado "Body" → "raw" → "JSON"
- Asegúrate de que el JSON esté bien formado (con comillas dobles)

---

## 📊 Variables de Entorno en Postman (Opcional)

Puedes crear variables en Postman para facilitar las pruebas:

1. En Postman, crea un **Environment**
2. Agrega estas variables:
   - `base_url`: `http://localhost:3000`
   - `user_id`: (vacío, lo llenarás después)
   - `user_email`: `test@ejemplo.com`
   - `user_password`: `password123`

3. Usa las variables en tus requests:
```
{{base_url}}/api/auth/login
```

