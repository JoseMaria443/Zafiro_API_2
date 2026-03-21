import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 3000;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('\n Zafiro esta vivo \n');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Servidor loca: http://localhost:${PORT}`);
  console.log(`Servidor con ip:    http://0.0.0.0:${PORT}`);
  console.log(`Entorno:               ${process.env.NODE_ENV || 'development'}`);
  console.log(`Verificación de estado:          http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\n📋 Endpoints disponibles:');
  console.log(`   POST /api/auth/session - Login con Authorization Bearer Clerk`);
  console.log(`   POST /api/auth/register/session - Registro con Authorization Bearer Clerk`);
  console.log(`   POST /api/calendar/activities - Crear actividad`);
  console.log(`   GET  /api/calendar/activities/user/:userId - Listar actividades\n`);
  
  // Verificar configuración
  const clerkConfigured = !!process.env.CLERK_SECRET_KEY;
  const dbConfigured = !!process.env.DATABASE_URL;
  const authBypassEnabled = ['1', 'true', 'yes', 'on'].includes((process.env.AUTH_BYPASS_ENABLED || '').toLowerCase());
  
  console.log('🔧 Estado de configuración:');
  console.log(`   ${clerkConfigured ? '✅' : '❌'} CLERK_SECRET_KEY ${clerkConfigured ? 'configurada' : 'FALTANTE'}`);
  console.log(`   ${dbConfigured ? '✅' : '❌'} DATABASE_URL ${dbConfigured ? 'configurada' : 'FALTANTE'}`);
  console.log(`   ${authBypassEnabled ? '⚠️' : '✅'} AUTH_BYPASS_ENABLED ${authBypassEnabled ? 'ACTIVO' : 'desactivado'}`);
  
  if (!clerkConfigured) {
    console.log('\n WARNING: CLERK_SECRET_KEY no configurada - Login no funcionará');
  }
  if (authBypassEnabled) {
    console.log(' WARNING: AUTH_BYPASS_ENABLED activo - endpoints protegidos NO validan token de Clerk');
  }
  if (!dbConfigured) {
    console.log('\n WARNING: DATABASE_URL no configurada - Base de datos no funcionará');
  }
  console.log('\n');
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`ERROR: El puerto ${PORT} ya está en uso.`);
  } else {
    console.error('ERROR al iniciar el servidor:', error);
  }
});