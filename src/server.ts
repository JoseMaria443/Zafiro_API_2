import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('Servidor ZAFIRO corriendo correctamente en: ' + PORT);
  console.log('Entorno: ' + (process.env.NODE_ENV || 'development'));
});
