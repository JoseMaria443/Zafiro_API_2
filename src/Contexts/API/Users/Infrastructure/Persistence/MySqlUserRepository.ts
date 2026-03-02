import { User } from '../../Domain/User.js';
import { UserSettings } from '../../Domain/UserSettings.js';
import type { IUserRepository, IUserSettingsRepository } from '../../Domain/UserRepository.js';
import { PostgresConnection } from '../../../../Shared/Infrastructure/Database/PostgresConnection.js';

export class MySqlUserRepository implements IUserRepository, IUserSettingsRepository {
  private db = PostgresConnection.getInstance();

  async save(user: User): Promise<void> {
    await this.db.query(
      `INSERT INTO usuarios (correo, contrasenna, nombre, token_google) 
       VALUES ($1, $2, $3, $4)`,
      [user.correo, user.password, user.nombre, user.tokenGoogle || null]
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

  // UserSettings methods
  async save(settings: UserSettings): Promise<void> {
    await this.db.query(
      `INSERT INTO ajustes_usuario (id_usuario, ocupacion, hora_inicio, hora_fin) 
       VALUES ($1, $2, $3, $4)`,
      [settings.idUsuario, settings.ocupacion || null, settings.horaInicio || null, settings.horaFin || null]
    );
  }

  async findByUserId(idUsuario: string): Promise<UserSettings | null> {
    const result = await this.db.query(
      'SELECT * FROM ajustes_usuario WHERE id_usuario = $1',
      [idUsuario]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new UserSettings(
      row.id,
      row.id_usuario,
      row.ocupacion,
      row.hora_inicio,
      row.hora_fin
    );
  }

  async updateSettings(settings: UserSettings): Promise<void> {
    await this.db.query(
      `UPDATE ajustes_usuario 
       SET ocupacion = $1, hora_inicio = $2, hora_fin = $3
       WHERE id = $4`,
      [settings.ocupacion || null, settings.horaInicio || null, settings.horaFin || null, settings.id]
    );
  }

  async deleteSettings(id: string): Promise<void> {
    await this.db.query('DELETE FROM ajustes_usuario WHERE id = $1', [id]);
  }
}
