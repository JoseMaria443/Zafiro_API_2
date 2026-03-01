import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 3000;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor ZAFIRO corriendo en: http://0.0.0.0:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está en uso.`);
  } else {
    console.error('Error al iniciar el servidor:', error);
  }
});