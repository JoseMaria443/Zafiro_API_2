import { UserSettings } from '../../Domain/UserSettings.js';
import type { IUserSettingsRepository } from '../../Domain/UserRepository.js';
import { PostgresConnection } from '../../../../Shared/Infrastructure/Database/PostgresConnection.js';
import { randomUUID } from 'crypto';

export class MySqlUserSettingsRepository implements IUserSettingsRepository {
  private db = PostgresConnection.getInstance();

  async save(settings: UserSettings): Promise<void> {
    const id = randomUUID(); // Generate UUID for settings
    await this.db.query(
      `INSERT INTO ajustes_usuario (id, id_usuario, ocupacion, hora_inicio, hora_fin) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, settings.idUsuario, settings.ocupacion || null, settings.horaInicio || null, settings.horaFin || null]
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

  async update(settings: UserSettings): Promise<void> {
    await this.db.query(
      `UPDATE ajustes_usuario 
       SET ocupacion = $1, hora_inicio = $2, hora_fin = $3
       WHERE id_usuario = $4`,
      [settings.ocupacion || null, settings.horaInicio || null, settings.horaFin || null, settings.idUsuario]
    );
  }

  async delete(idUsuario: string): Promise<void> {
    await this.db.query('DELETE FROM ajustes_usuario WHERE id_usuario = $1', [idUsuario]);
  }
}
