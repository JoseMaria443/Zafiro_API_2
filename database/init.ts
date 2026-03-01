import { PostgresConnection } from '../src/Contexts/Shared/Infrastructure/Database/PostgresConnection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  const db = PostgresConnection.getInstance();
  
  try {
    console.log('🔄 Inicializando base de datos...');
    
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    
    await db.query(schemaSQL);
    
    console.log('✅ Base de datos inicializada correctamente');
    console.log('📊 Tablas creadas:');
    console.log('   - users');
    console.log('   - tags');
    console.log('   - priorities');
    console.log('   - repetition_frequencies');
    console.log('   - activity_details');
    console.log('   - repetitions');
    console.log('   - activities');
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    await db.close();
    process.exit(1);
  }
}

initDatabase();
