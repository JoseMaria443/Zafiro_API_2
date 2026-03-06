import { Pool } from 'pg';

export class PostgresConnection {
  private static instance: PostgresConnection;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DB_URL || 'postgresql://postgres:postgres@localhost:5432/zafiro',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Error inesperado en el pool de PostgreSQL:', err);
    });
  }

  public static getInstance(): PostgresConnection {
    if (!PostgresConnection.instance) {
      PostgresConnection.instance = new PostgresConnection();
    }
    return PostgresConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query ejecutado:', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Error en query:', { text, error });
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
