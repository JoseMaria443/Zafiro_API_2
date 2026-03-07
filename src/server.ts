import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 3000;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('\n🎉 ¡FELICIDADES! API ZAFIRO desplegada exitosamente\n');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`✅ Servidor red local:    http://0.0.0.0:${PORT}`);
  console.log(`✅ Entorno:               ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check:          http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\n📋 Endpoints disponibles:');
  console.log(`   POST /api/auth/login  - Login con Clerk`);
  console.log(`   POST /api/auth/register - Registro`);
  console.log(`   POST /api/calendar/activities - Crear actividad`);
  console.log(`   GET  /api/calendar/activities/user/:userId - Listar actividades\n`);
  
  // Verificar configuración
  const clerkConfigured = !!process.env.CLERK_SECRET_KEY;
  const dbConfigured = !!process.env.DATABASE_URL;
  
  console.log('🔧 Estado de configuración:');
  console.log(`   ${clerkConfigured ? '✅' : '❌'} CLERK_SECRET_KEY ${clerkConfigured ? 'configurada' : 'FALTANTE'}`);
  console.log(`   ${dbConfigured ? '✅' : '❌'} DATABASE_URL ${dbConfigured ? 'configurada' : 'FALTANTE'}`);
  
  if (!clerkConfigured) {
    console.log('\n⚠️  WARNING: CLERK_SECRET_KEY no configurada - Login no funcionará');
  }
  if (!dbConfigured) {
    console.log('\n⚠️  WARNING: DATABASE_URL no configurada - Base de datos no funcionará');
  }
  console.log('\n');
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ ERROR: El puerto ${PORT} ya está en uso.`);
  } else {
    console.error('❌ ERROR al iniciar el servidor:', error);
  }
});