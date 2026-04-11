import pkg from 'pg';
const { Pool } = pkg;

export class PostgresConnection {
  private static instance: PostgresConnection;
  private pool: typeof Pool.prototype;

  private constructor() {
    const connectionString = process.env.DATABASE_URL || '';

    if (!connectionString) {
      throw new Error('DATABASE_URL no está configurada en las variables de entorno');
    }

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Para Supabase
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err: Error) => {
      console.error('Error inesperado en el pool de PostgreSQL:', err);
    });
  }

  public static getInstance(): PostgresConnection {
    if (!PostgresConnection.instance) {
      PostgresConnection.instance = new PostgresConnection();
    }
    return PostgresConnection.instance;
  }

  public getPool(): typeof Pool.prototype {
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query ejecutado:', { duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Error en query:', { text, error });
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Conexión a PostgreSQL cerrada');
  }
}
