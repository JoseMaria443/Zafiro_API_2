# 🔍 Guía de Diagnóstico - Zafiro API

## Problema: Inicio de sesión por Clerk pero sin datos en la base de datos

Esta guía te ayudará a diagnosticar el problema paso por paso.

---

## ✅ Paso 1: Verificar que la API está corriendo

```bash
npm run dev
```

**Deberías ver:**
```
🎉 ¡FELICIDADES! API ZAFIRO desplegada exitosamente

═══════════════════════════════════════════════════
✅ Servidor corriendo en: http://localhost:3000
✅ CLERK_SECRET_KEY configurada
✅ DATABASE_URL configurada
═══════════════════════════════════════════════════
```

**❌ Si ves advertencias:**
- `❌ CLERK_SECRET_KEY FALTANTE` → Crea el archivo `.env` y agrega la clave
- `❌ DATABASE_URL FALTANTE` → Verifica tu conexión a Supabase

---

## ✅ Paso 2: Probar que la API responde

En otra terminal, ejecuta:

```bash
node test-api.js
```

**Deberías ver:**
```
✅ API está respondiendo correctamente
```

---

## ✅ Paso 3: Verificar el Frontend

### 3.1 Verifica que tu frontend tenga las variables de entorno:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3.2 Verifica que tu código del frontend esté haciendo la petición correctamente:

```javascript
// Después de autenticar con Clerk
const { getToken } = useAuth();

async function loginWithAPI() {
  try {
    // Obtener el token de sesión de Clerk
    const clerkToken = await getToken();
    
    // Enviar al backend
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clerkToken }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login exitoso:', data);
      // Guardar token del API para peticiones futuras
      localStorage.setItem('apiToken', data.data.token);
    } else {
      console.error('❌ Login falló:', data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
```

---

## ✅ Paso 4: Revisar los logs del servidor

Cuando hagas login desde el frontend, deberías ver en la consola del servidor:

```
🔐 [AUTH] Intentando login...
✅ [AUTH] Token recibido, validando con Clerk...
   → Validando token con Clerk...
   ✅ Token válido - Clerk User ID: user_xxx, Email: tu@email.com
   → Buscando usuario en BD con Clerk ID: user_xxx
   → Usuario NO encontrado, creando nuevo usuario en BD...
   ✅ Usuario creado exitosamente en BD con ID: uuid-xxx
✅ [AUTH] Login exitoso - Usuario: tu@email.com (NUEVO)
```

**❌ Si ves errores:**

### Error: "CLERK_SECRET_KEY no está configurada"
**Solución:** 
1. Crea archivo `.env` en la raíz de la API
2. Agrega: `CLERK_SECRET_KEY=sk_test_tu_clave_aqui`
3. Reinicia el servidor

### Error: "Error validando token de Clerk"
**Solución:**
1. Verifica que la clave sea la correcta (copia de nuevo desde Clerk Dashboard)
2. Verifica que frontend y backend usen el mismo proyecto de Clerk
3. El token debe comenzar con `sk_test_` o `sk_live_`

### Error relacionado con la base de datos
**Solución:**
1. Verifica que `DATABASE_URL` esté en el `.env`
2. Verifica que la conexión a Supabase funcione
3. Ejecuta el schema: `psql -h ... -f bd/schema.sql`

---

## ✅ Paso 5: Verificar la base de datos

Conéctate a tu base de datos PostgreSQL y ejecuta:

```sql
-- Ver todos los usuarios
SELECT id, clerk_user_id, correo, nombre, created_at 
FROM usuarios 
ORDER BY created_at DESC;
```

**Deberías ver tu usuario recién creado.**

---

## 🐛 Debugging avanzado

### Ver todas las peticiones que llegan al servidor:

Agrega esto en `src/app.ts` después de `app.use(express.json())`:

```typescript
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});
```

### Verificar comunicación Frontend → Backend:

En el navegador (consola F12):

```javascript
// Verificar que puedes hacer fetch
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 🆘 Checklist Final

- [ ] API corriendo en puerto 3000
- [ ] `.env` con `CLERK_SECRET_KEY` y `DATABASE_URL`
- [ ] Frontend tiene `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] Frontend hace petición POST a `/api/auth/login`
- [ ] Frontend envía `{ clerkToken: "..." }` en el body
- [ ] Logs del servidor muestran el proceso de login
- [ ] Base de datos tiene tabla `usuarios` creada

---

## 📞 ¿Todavía no funciona?

Comparte:
1. Los logs completos del servidor cuando haces login
2. El error específico que ves (si hay alguno)
3. La respuesta que recibes del endpoint `/api/auth/login`
