import { Priority } from '../../Domain/Priority.js';
import type { IPriorityRepository } from '../../Domain/PriorityRepository.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';

export class MySqlPriorityRepository implements IPriorityRepository {
  private db = PostgresConnection.getInstance();

  async save(priority: Priority): Promise<void> {
    await this.db.query(
      `INSERT INTO prioridad (id_actividad, valor, color)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_actividad) DO UPDATE
       SET valor = $2, color = $3, updated_at = NOW()`,
      [priority.idActividad, priority.valor, priority.color]
    );
  }

  async findById(id: string): Promise<Priority | null> {
    const result = await this.db.query(
      'SELECT * FROM prioridad WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new Priority(
      row.id.toString(),
      row.id_actividad,
      row.valor,
      row.color
    );
  }

  async findByActivityId(idActividad: string): Promise<Priority | null> {
    const result = await this.db.query(
      'SELECT * FROM prioridad WHERE id_actividad = $1',
      [idActividad]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new Priority(
      row.id.toString(),
      row.id_actividad,
      row.valor,
      row.color
    );
  }

  async findByUserId(idUsuario: string): Promise<Priority[]> {
    const result = await this.db.query(
      `SELECT p.* FROM prioridad p
       INNER JOIN actividades a ON a.id = p.id_actividad
       WHERE a.id_usuario = $1
       ORDER BY p.created_at DESC`,
      [idUsuario]
    );

    return result.rows.map((row: any) => new Priority(
      row.id.toString(),
      row.id_actividad,
      row.valor,
      row.color
    ));
  }

  async update(priority: Priority): Promise<void> {
    await this.db.query(
      `UPDATE prioridad 
       SET valor = $1, color = $2, updated_at = NOW()
       WHERE id = $3`,
      [priority.valor, priority.color, priority.id]
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query(
      'DELETE FROM prioridad WHERE id = $1',
      [id]
    );
  }
}
