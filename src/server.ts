import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 8000;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('\n Zafiro esta vivo \n');
  console.log('═══════════════════════════════════════════════════');
  
  // Verificar configuración
  const clerkConfigured = !!process.env.CLERK_SECRET_KEY;
  const dbConfigured = !!process.env.DATABASE_URL;
  
  console.log('🔧 Estado de configuración:');
  console.log(`   ${clerkConfigured ? '✅' : '❌'} CLERK_SECRET_KEY ${clerkConfigured ? 'configurada' : 'FALTANTE'}`);
  console.log(`   ${dbConfigured ? '✅' : '❌'} DATABASE_URL ${dbConfigured ? 'configurada' : 'FALTANTE'}`);
  
  if (!clerkConfigured) {
    console.log('\n WARNING: CLERK_SECRET_KEY no configurada - Login no funcionará');
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