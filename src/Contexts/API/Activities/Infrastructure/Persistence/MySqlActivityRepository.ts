import { Activity } from '../../Domain/Activity.js';
import type { IActivityRepository } from '../../Domain/ActivityRepository.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';
import { ActivityDetails } from '../../Domain/ActivityDetails.js';
import { ActivityPriority } from '../../Domain/ActivityPriority.js';
import { Repetition } from '../../Domain/Repetition.js';
import type { EventDateTime, EventActor, EventReminders } from '../../Domain/Activity.js';

export interface GoogleCalendarEventInput {
  id: string;
  calendarId: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  organizerEmail?: string;
  start?: EventDateTime;
  end?: EventDateTime;
  created?: string;
  updated?: string;
  rawPayload?: unknown;
}

export class MySqlActivityRepository implements IActivityRepository {
  private db = PostgresConnection.getInstance();

  async save(activity: Activity): Promise<void> {
    const client = this.db.getPool();
    
    try {
      await client.query('BEGIN');

      // Insertar actividad principal con todos los campos de RF-03
      const activityResult = await client.query(
        `INSERT INTO actividades (
          id_clerk, 
          id_etiqueta, 
          id_usuario, 
          fecha_creacion, 
          fecha_inicio, 
          fecha_fin, 
          hora_inicio, 
          hora_fin, 
          start_datetime,
          end_datetime,
          start_timezone,
          end_timezone,
          tiempo_descanso_min, 
          tiempo_muerto_min, 
          source, 
          status, 
          google_event_id,
          google_calendar_id,
          event_created_at,
          event_updated_at,
          last_synced_at,
          updated_at
         ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()) 
         RETURNING id`,
        [
          activity.id,
          activity.idEtiqueta || null,
          activity.idUsuario,
          activity.created,
          activity.fechaInicio || null,
          activity.fechaFin || null,
          activity.horaInicio || null,
          activity.horaFin || null,
          activity.start.dateTime || null,
          activity.end.dateTime || null,
          activity.start.timeZone || null,
          activity.end.timeZone || null,
          activity.tiempoDescansoMin || null,
          activity.tiempoMuertoMin || null,
          activity.source || 'local',
          activity.status || 'confirmed',
          activity.googleEventId || null,
          'primary',
          activity.created,
          activity.updated
        ]
      );
      const activityId = activityResult.rows[0]?.id;

      // Insertar detalles de la actividad
      if (activity.details && activityId) {
        await client.query(
          `INSERT INTO actividades_detalles (id_actividad, title, descripcion, ubicacion, html_link, organizer_email, raw_payload, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            activityId,
            activity.summary,
            activity.details.description || null,
            activity.details.location || null,
            activity.htmlLink || null,
            activity.organizer?.email || null,
            null
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

    return result.rows.map((row: any) => this.mapRowToActivity(row));
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

    return result.rows.map((row: any) => this.mapRowToActivity(row));
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

    return result.rows.map((row: any) => this.mapRowToActivity(row));
  }

  async update(activity: Activity): Promise<void> {
    await this.save(activity);
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM actividades WHERE id_clerk = $1', [id]);
  }

  async upsertGoogleEvent(idUsuario: string, event: GoogleCalendarEventInput): Promise<void> {
    if (!event.id) {
      return;
    }

    const start = this.normalizeEventDate(event.start);
    const end = this.normalizeEventDate(event.end);
    const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);
    const summary = event.summary?.trim() || 'Evento sin título';
    const status = this.normalizeStatus(event.status);
    const created = event.created || new Date().toISOString();
    const updated = event.updated || created;
    const calendarId = event.calendarId || 'primary';

    const result = await this.db.query(
      `INSERT INTO actividades (
         id_usuario,
         id_clerk,
         google_event_id,
         google_calendar_id,
         source,
         status,
         fecha_creacion,
         fecha_inicio,
         fecha_fin,
         hora_inicio,
         hora_fin,
         start_datetime,
         end_datetime,
         start_timezone,
         end_timezone,
         is_all_day,
         event_created_at,
         event_updated_at,
         last_synced_at,
         updated_at
       ) VALUES (
         $1,
         $2,
         $3,
         $4,
         'google',
         $5,
         $6,
         $7,
         $8,
         $9,
         $10,
         $11,
         $12,
         $13,
         $14,
         $15,
         $16,
         $17,
         NOW(),
         NOW()
       )
       ON CONFLICT (id_usuario, google_calendar_id, google_event_id)
       DO UPDATE SET
         id_clerk = EXCLUDED.id_clerk,
         source = 'google',
         status = EXCLUDED.status,
         fecha_creacion = EXCLUDED.fecha_creacion,
         fecha_inicio = EXCLUDED.fecha_inicio,
         fecha_fin = EXCLUDED.fecha_fin,
         hora_inicio = EXCLUDED.hora_inicio,
         hora_fin = EXCLUDED.hora_fin,
         start_datetime = EXCLUDED.start_datetime,
         end_datetime = EXCLUDED.end_datetime,
         start_timezone = EXCLUDED.start_timezone,
         end_timezone = EXCLUDED.end_timezone,
         is_all_day = EXCLUDED.is_all_day,
         event_created_at = EXCLUDED.event_created_at,
         event_updated_at = EXCLUDED.event_updated_at,
         last_synced_at = NOW(),
         updated_at = NOW()
       RETURNING id`,
      [
        idUsuario,
        event.id,
        event.id,
        calendarId,
        status,
        created,
        start.date,
        end.date,
        start.hour,
        end.hour,
        start.dateTime,
        end.dateTime,
        start.timeZone,
        end.timeZone,
        isAllDay,
        created,
        updated,
      ]
    );

    const activityId = result.rows[0]?.id as string | undefined;
    if (!activityId) {
      return;
    }

    await this.db.query(
      `INSERT INTO actividades_detalles (
         id_actividad,
         title,
         descripcion,
         ubicacion,
         html_link,
         organizer_email,
         raw_payload,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (id_actividad)
       DO UPDATE SET
         title = EXCLUDED.title,
         descripcion = EXCLUDED.descripcion,
         ubicacion = EXCLUDED.ubicacion,
         html_link = EXCLUDED.html_link,
         organizer_email = EXCLUDED.organizer_email,
         raw_payload = EXCLUDED.raw_payload,
         updated_at = NOW()`,
      [
        activityId,
        summary,
        event.description || null,
        event.location || null,
        event.htmlLink || null,
        event.organizerEmail || null,
        event.rawPayload ? JSON.stringify(event.rawPayload) : null,
      ]
    );
  }

  private normalizeStatus(status?: string): 'confirmed' | 'tentative' | 'cancelled' {
    if (status === 'tentative') {
      return 'tentative';
    }
    if (status === 'cancelled') {
      return 'cancelled';
    }
    return 'confirmed';
  }

  private normalizeEventDate(date?: EventDateTime): {
    date: Date | null;
    hour: string | null;
    dateTime: string | null;
    timeZone: string | null;
  } {
    if (!date) {
      return {
        date: null,
        hour: null,
        dateTime: null,
        timeZone: null,
      };
    }

    if (date.dateTime) {
      const parsed = new Date(date.dateTime);
      const hour = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(11, 19);
      return {
        date: Number.isNaN(parsed.getTime()) ? null : parsed,
        hour,
        dateTime: Number.isNaN(parsed.getTime()) ? null : parsed.toISOString(),
        timeZone: date.timeZone || 'UTC',
      };
    }

    if (date.date) {
      const parsed = new Date(`${date.date}T00:00:00.000Z`);
      return {
        date: Number.isNaN(parsed.getTime()) ? null : parsed,
        hour: null,
        dateTime: null,
        timeZone: date.timeZone || 'UTC',
      };
    }

    return {
      date: null,
      hour: null,
      dateTime: null,
      timeZone: null,
    };
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
      dateTime: row.start_datetime || row.fecha_creacion || now.toISOString(),
      timeZone: row.start_timezone || 'UTC'
    };

    const end: EventDateTime = {
      dateTime: row.end_datetime || row.fecha_creacion || now.toISOString(),
      timeZone: row.end_timezone || 'UTC'
    };

    return new Activity(
      row.id_clerk || row.id?.toString() || '',
      row.id_usuario,
      row.title || 'Sin título',
      start,
      end,
      row.fecha_creacion || now.toISOString(),
      row.fecha_creacion || now.toISOString(),
      row.status || 'confirmed',
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
      repetition,
      // RF-03 Fields
      row.fecha_inicio ? new Date(row.fecha_inicio) : undefined,
      row.fecha_fin ? new Date(row.fecha_fin) : undefined,
      row.hora_inicio || undefined,
      row.hora_fin || undefined,
      row.tiempo_descanso_min || undefined,
      row.tiempo_muerto_min || undefined,
      row.source || 'local',
      row.google_event_id || undefined,
      undefined
    );
  }
}
