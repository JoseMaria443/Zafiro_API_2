import { Activity } from '../../Domain/Activity.js';
import type { IActivityRepository } from '../../Domain/ActivityRepository.js';
import { PostgresConnection } from '../../../../Shared/Infrastructure/Database/PostgresConnection.js';
import { ActivityDetails } from '../../Domain/ActivityDetails.js';
import { ActivityPriority } from '../../Domain/ActivityPriority.js';
import { Repetition } from '../../Domain/Repetition.js';
import type { EventDateTime, EventActor, EventReminders } from '../../Domain/Activity.js';

export class MySqlActivityRepository implements IActivityRepository {
  private db = PostgresConnection.getInstance();

  async save(activity: Activity): Promise<void> {
    const client = this.db.getPool();
    
    try {
      await client.query('BEGIN');

      // Insertar actividad principal
      const activityResult = await client.query(
        `INSERT INTO actividades (id_clerk, id_etiqueta, id_usuario, fecha_creacion) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [
          activity.id, // Usamos id como id_clerk temporalmente
          activity.idEtiqueta || null,
          activity.idUsuario,
          activity.created
        ]
      );
      const activityId = activityResult.rows[0]?.id;

      // Insertar detalles de la actividad
      if (activity.details && activityId) {
        await client.query(
          `INSERT INTO actividades_detalles (id_actividad, title, descripcion, ubicacion) 
           VALUES ($1, $2, $3, $4)`,
          [
            activityId,
            activity.summary,
            activity.details.description || null,
            activity.details.location || null
          ]
        );
      }

      // Insertar prioridad si existe
      if (activity.priority && activityId) {
        await client.query(
          `INSERT INTO prioridad (id_actividad, valor, color)
           VALUES ($1, $2, $3)`,
          [activityId, activity.priority.valor, activity.priority.color]
        );
      }

      // Insertar repetición si existe
      if (activity.repetition && activityId) {
        await client.query(
          `INSERT INTO repeticiones (id_frecuencia, dias_semana, fecha_inicio, fecha_fin, id_actividad)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            activity.repetition.idFrecuencia,
            activity.repetition.diasSemana,
            activity.repetition.fechaInicio,
            activity.repetition.fechaFin,
            activityId
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error guardando actividad:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Activity | null> {
    const result = await this.db.query(
      `SELECT a.*, 
              ad.title, ad.descripcion, ad.ubicacion,
              p.valor as prioridad_valor, p.color as prioridad_color,
              r.id_frecuencia, r.dias_semana, r.fecha_inicio, r.fecha_fin
       FROM actividades a
       LEFT JOIN actividades_detalles ad ON a.id = ad.id_actividad
       LEFT JOIN prioridad p ON a.id = p.id_actividad
       LEFT JOIN repeticiones r ON a.id = r.id_actividad
       WHERE a.id_clerk = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToActivity(result.rows[0]);
  }

  async findByUserId(idUsuario: string): Promise<Activity[]> {
    const result = await this.db.query(
      `SELECT a.*, 
              ad.title, ad.descripcion, ad.ubicacion,
              p.valor as prioridad_valor, p.color as prioridad_color,
              r.id_frecuencia, r.dias_semana, r.fecha_inicio, r.fecha_fin
       FROM actividades a
       LEFT JOIN actividades_detalles ad ON a.id = ad.id_actividad
       LEFT JOIN prioridad p ON a.id = p.id_actividad
       LEFT JOIN repeticiones r ON a.id = r.id_actividad
       WHERE a.id_usuario = $1
       ORDER BY a.id DESC`,
      [idUsuario]
    );

    return result.rows.map(row => this.mapRowToActivity(row));
  }

  async findByUserIdAndDate(idUsuario: string, date: Date): Promise<Activity[]> {
    const targetDate = date.toISOString().split('T')[0];
    
    const result = await this.db.query(
      `SELECT a.*, 
              ad.title, ad.descripcion, ad.ubicacion,
              p.valor as prioridad_valor, p.color as prioridad_color,
              r.id_frecuencia, r.dias_semana, r.fecha_inicio, r.fecha_fin
       FROM actividades a
       LEFT JOIN actividades_detalles ad ON a.id = ad.id_actividad
       LEFT JOIN prioridad p ON a.id = p.id_actividad
       LEFT JOIN repeticiones r ON a.id = r.id_actividad
       WHERE a.id_usuario = $1 
         AND DATE(a.fecha_creacion) = $2
       ORDER BY a.id DESC`,
      [idUsuario, targetDate]
    );

    return result.rows.map(row => this.mapRowToActivity(row));
  }

  async findByTagId(idEtiqueta: number): Promise<Activity[]> {
    const result = await this.db.query(
      `SELECT a.*, 
              ad.title, ad.descripcion, ad.ubicacion,
              p.valor as prioridad_valor, p.color as prioridad_color,
              r.id_frecuencia, r.dias_semana, r.fecha_inicio, r.fecha_fin
       FROM actividades a
       LEFT JOIN actividades_detalles ad ON a.id = ad.id_actividad
       LEFT JOIN prioridad p ON a.id = p.id_actividad
       LEFT JOIN repeticiones r ON a.id = r.id_actividad
       WHERE a.id_etiqueta = $1
       ORDER BY a.id DESC`,
      [idEtiqueta]
    );

    return result.rows.map(row => this.mapRowToActivity(row));
  }

  async update(activity: Activity): Promise<void> {
    await this.save(activity);
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM actividades WHERE id_clerk = $1', [id]);
  }

  private mapRowToActivity(row: any): Activity {
    const details = new ActivityDetails(
      row.id || 0,
      row.id_clerk || row.id?.toString() || '',
      row.title || 'Sin título',
      row.descripcion || undefined,
      row.ubicacion || undefined
    );

    let priority: ActivityPriority | undefined;
    if (row.prioridad_valor) {
      priority = new ActivityPriority(
        row.id,
        row.id_usuario,
        row.prioridad_valor as any,
        row.prioridad_color || '#FFC107'
      );
    }

    let repetition: Repetition | undefined;
    if (row.id_frecuencia) {
      repetition = new Repetition(
        row.id,
        row.id_usuario,
        row.id_frecuencia,
        row.dias_semana || 'MON',
        new Date(row.fecha_inicio),
        new Date(row.fecha_fin)
      );
    }

    // Crear fechas de inicio y fin básicas
    const now = new Date();
    const start: EventDateTime = {
      dateTime: row.fecha_creacion || now.toISOString(),
      timeZone: 'America/Mexico_City'
    };

    const end: EventDateTime = {
      dateTime: row.fecha_creacion || now.toISOString(),
      timeZone: 'America/Mexico_City'
    };

    return new Activity(
      row.id_clerk || row.id?.toString() || '',
      row.id_usuario,
      row.title || 'Sin título',
      start,
      end,
      row.fecha_creacion || now.toISOString(),
      row.fecha_creacion || now.toISOString(),
      'confirmed',
      details,
      row.id_etiqueta || undefined,
      'calendar#event',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      priority,
      repetition
    );
  }
}
