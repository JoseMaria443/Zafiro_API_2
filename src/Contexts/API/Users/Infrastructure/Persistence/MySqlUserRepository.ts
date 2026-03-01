import { User } from '../../Domain/User.js';
import type { IUserRepository } from '../../Domain/UserRepository.js';
import { PostgresConnection } from '../../../../Shared/Infrastructure/Database/PostgresConnection.js';

export class MySqlUserRepository implements IUserRepository {
  private db = PostgresConnection.getInstance();

  async save(user: User): Promise<void> {
    await this.db.query(
      `INSERT INTO usuarios (correo, contrasenna, nombre, token_google) 
       VALUES ($1, $2, $3, $4)`,
      [user.correo, user.password, user.nombre, user.tokenGoogle || null]
    );
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(
      row.id,
      row.correo,
      row.contrasenna,
      row.nombre,
      row.token_google
    );
  }

  async findByEmail(correo: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(
      row.id,
      row.correo,
      row.contrasenna,
      row.nombre,
      row.token_google
    );
  }

  async update(user: User): Promise<void> {
    await this.db.query(
      `UPDATE usuarios 
       SET correo = $1, contrasenna = $2, nombre = $3, token_google = $4
       WHERE id = $5`,
      [user.correo, user.password, user.nombre, user.tokenGoogle || null, user.id]
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.query('DELETE FROM usuarios WHERE id = $1', [id]);
  }

  async exists(correo: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT COUNT(*) as count FROM usuarios WHERE correo = $1',
      [correo]
    );
    return parseInt(result.rows[0]?.count || '0') > 0;
  }
}
