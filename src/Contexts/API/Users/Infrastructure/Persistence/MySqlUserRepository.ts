import { User } from '../../Domain/User.js';
import type { IUserRepository } from '../../Domain/UserRepository.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';
import { randomUUID } from 'crypto';

export class MySqlUserRepository implements IUserRepository {
  private db = PostgresConnection.getInstance();

  async save(user: User): Promise<void> {
    const userId = randomUUID(); // Generate UUID if not provided
    await this.db.query(
      `INSERT INTO usuarios (id, clerk_user_id, correo, contrasenna, nombre, token_google) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, user.clerkUserId, user.correo, user.password, user.nombre, user.tokenGoogle || null]
    );
  }

  async findById(id: string): Promise<User | null> {
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
      row.clerk_user_id,
      row.correo,
      row.contrasenna,
      row.nombre,
      row.token_google
    );
  }

  async findByClerkUserId(clerkUserId: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM usuarios WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(
      row.id,
      row.clerk_user_id,
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
      row.clerk_user_id,
      row.correo,
      row.contrasenna,
      row.nombre,
      row.token_google
    );
  }

  async update(user: User): Promise<void> {
    await this.db.query(
      `UPDATE usuarios 
       SET clerk_user_id = $1, correo = $2, contrasenna = $3, nombre = $4, token_google = $5
       WHERE id = $6`,
      [user.clerkUserId, user.correo, user.password, user.nombre, user.tokenGoogle || null, user.id]
    );
  }

  async delete(id: string): Promise<void> {
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
