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
          id,
          id_usuario, 
          id_etiqueta, 
          google_event_id,
          google_calendar_id,
          summary,
          status,
          start_datetime,
          end_datetime,
          start_date,
          end_date,
          start_timezone,
          end_timezone,
          event_created,
          event_updated,
          source,
          last_synced_at,
          tiempo_descanso_min, 
          tiempo_muerto_min
         ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
         RETURNING id`,
        [
          activity.id,
          activity.idUsuario,
          activity.idEtiqueta || null,
          activity.googleEventId || null,
          'primary',
          activity.summary || 'Sin título',
          activity.status || 'confirmed',
          activity.start.dateTime || null,
          activity.end.dateTime || null,
          activity.start.date || null,
          activity.end.date || null,
          activity.start.timeZone || 'UTC',
          activity.end.timeZone || 'UTC',
          activity.created || new Date().toISOString(),
          activity.updated || new Date().toISOString(),
          activity.source || 'local',
          activity.source === 'google' ? new Date().toISOString() : null,
          activity.tiempoDescansoMin || 0,
          activity.tiempoMuertoMin || 0
        ]
      );
      const activityId = activityResult.rows[0]?.id;

      // Insertar detalles de la actividad
      if (activity.details && activityId) {
        await client.query(
          `INSERT INTO actividades_detalles (
             id_actividad, 
             description, 
             location, 
             html_link, 
             organizer_email,
             organizer_display_name,
             creator_email,
             creator_display_name,
             recurrence,
             reminders_use_default,
             reminders_overrides,
             raw_payload
           ) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id_actividad) DO UPDATE
           SET description = EXCLUDED.description,
               location = EXCLUDED.location,
               html_link = EXCLUDED.html_link,
               organizer_email = EXCLUDED.organizer_email,
               organizer_display_name = EXCLUDED.organizer_display_name,
               creator_email = EXCLUDED.creator_email,
               creator_display_name = EXCLUDED.creator_display_name,
               recurrence = EXCLUDED.recurrence,
               reminders_use_default = EXCLUDED.reminders_use_default,
               reminders_overrides = EXCLUDED.reminders_overrides,
               raw_payload = EXCLUDED.raw_payload`,
          [
            activityId,
            activity.details.description || null,
            activity.details.location || null,
            activity.htmlLink || null,
            activity.organizer?.email || null,
            activity.organizer?.displayName || null,
            activity.creator?.email || null,
            activity.creator?.displayName || null,
            activity.recurrence || null,
            activity.reminders?.useDefault ?? true,
            activity.reminders?.overrides ? JSON.stringify(activity.reminders.overrides) : null,
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
              ad.id as detalle_id, ad.description, ad.location, ad.html_link, ad.recurrence, ad.reminders_use_default, ad.reminders_overrides,
              p.valor as prioridad_valor, p.color as prioridad_color,
              r.id_frecuencia, r.dias_semana, r.fecha_inicio, r.fecha_fin
       FROM actividades a
       LEFT JOIN actividades_detalles ad ON a.id = ad.id_actividad
       LEFT JOIN prioridad p ON a.id = p.id_actividad
       LEFT JOIN repeticiones r ON a.id = r.id_actividad
       WHERE a.id = $1`,
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
              ad.id as detalle_id, ad.description, ad.location, ad.html_link, ad.recurrence, ad.reminders_use_default, ad.reminders_overrides,
              p.valor as prioridad_valor, p.color as prioridad_color,
              r.id_frecuencia, r.dias_semana, r.fecha_inicio, r.fecha_fin
       FROM actividades a
       LEFT JOIN actividades_detalles ad ON a.id = ad.id_actividad
       LEFT JOIN prioridad p ON a.id = p.id_actividad
       LEFT JOIN repeticiones r ON a.id = r.id_actividad
       WHERE a.id_usuario = $1
       ORDER BY a.event_created DESC`,
      [idUsuario]
    );

    return result.rows.map((row: any) => this.mapRowToActivity(row));
  }

  async findByUserIdAndDate(idUsuario: string, date: Date): Promise<Activity[]> {
    const targetDate = date.toISOString().split('T')[0];
    
    const result = await this.db.query(
      `SELECT a.*, 
              ad.id as detalle_id, ad.description, ad.location, ad.html_link, ad.recurrence, ad.reminders_use_default, ad.reminders_overrides,
              p.valor as prioridad_valor, p.color as prioridad_color,
              r.id_frecuencia, r.dias_semana, r.fecha_inicio, r.fecha_fin
       FROM actividades a
       LEFT JOIN actividades_detalles ad ON a.id = ad.id_actividad
       LEFT JOIN prioridad p ON a.id = p.id_actividad
       LEFT JOIN repeticiones r ON a.id = r.id_actividad
       WHERE a.id_usuario = $1 
         AND (a.start_date = $2 OR DATE(a.start_datetime) = $2)
       ORDER BY a.start_datetime DESC`,
      [idUsuario, targetDate]
    );

    return result.rows.map((row: any) => this.mapRowToActivity(row));
  }

  async findByTagId(idEtiqueta: number): Promise<Activity[]> {
    const result = await this.db.query(
      `SELECT a.*, 
              ad.id as detalle_id, ad.description, ad.location, ad.html_link, ad.recurrence, ad.reminders_use_default, ad.reminders_overrides,
              p.valor as prioridad_valor, p.color as prioridad_color,
              r.id_frecuencia, r.dias_semana, r.fecha_inicio, r.fecha_fin
       FROM actividades a
       LEFT JOIN actividades_detalles ad ON a.id = ad.id_actividad
       LEFT JOIN prioridad p ON a.id = p.id_actividad
       LEFT JOIN repeticiones r ON a.id = r.id_actividad
       WHERE a.id_etiqueta = $1
       ORDER BY a.event_created DESC`,
      [idEtiqueta]
    );

    return result.rows.map((row: any) => this.mapRowToActivity(row));
  }

  async update(activity: Activity): Promise<void> {
    await this.save(activity);
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM actividades WHERE id = $1', [id]);
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
         google_event_id,
         google_calendar_id,
         summary,
         source,
         status,
         start_datetime,
         end_datetime,
         start_date,
         end_date,
         start_timezone,
         end_timezone,
         event_created,
         event_updated,
         last_synced_at
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
         NOW()
       )
       ON CONFLICT (id_usuario, google_calendar_id, google_event_id)
       DO UPDATE SET
         summary = EXCLUDED.summary,
         source = 'google',
         status = EXCLUDED.status,
         start_datetime = EXCLUDED.start_datetime,
         end_datetime = EXCLUDED.end_datetime,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         start_timezone = EXCLUDED.start_timezone,
         end_timezone = EXCLUDED.end_timezone,
         event_created = EXCLUDED.event_created,
         event_updated = EXCLUDED.event_updated,
         last_synced_at = NOW()
       RETURNING id`,
      [
        idUsuario,
        event.id,
        calendarId,
        summary,
        status,
        start.dateTime,
        end.dateTime,
        start.date,
        end.date,
        start.timeZone,
        end.timeZone,
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
         description,
         location,
         html_link,
         organizer_email,
         raw_payload
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id_actividad)
       DO UPDATE SET
         description = EXCLUDED.description,
         location = EXCLUDED.location,
         html_link = EXCLUDED.html_link,
         organizer_email = EXCLUDED.organizer_email,
         raw_payload = EXCLUDED.raw_payload`,
      [
        activityId,
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
    date: string | null;
    dateTime: string | null;
    timeZone: string | null;
  } {
    if (!date) {
      return {
        date: null,
        dateTime: null,
        timeZone: null,
      };
    }

    if (date.dateTime) {
      const parsed = new Date(date.dateTime);
      return {
        date: null,
        dateTime: Number.isNaN(parsed.getTime()) ? null : parsed.toISOString(),
        timeZone: date.timeZone || 'UTC',
      };
    }

    if (date.date) {
      return {
        date: date.date,
        dateTime: null,
        timeZone: date.timeZone || 'UTC',
      };
    }

    return {
      date: null,
      dateTime: null,
      timeZone: null,
    };
  }

  private mapRowToActivity(row: any): Activity {
    const details = new ActivityDetails(
      Number(row.detalle_id || 1),
      row.id?.toString() || '',
      row.summary || 'Sin título',
      row.description || undefined,
      row.location || undefined
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

    // Crear fechas de inicio y fin
    const now = new Date();
    const start: EventDateTime = {
      dateTime: row.start_datetime || undefined,
      date: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : undefined,
      timeZone: row.start_timezone || 'UTC'
    };

    const end: EventDateTime = {
      dateTime: row.end_datetime || undefined,
      date: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : undefined,
      timeZone: row.end_timezone || 'UTC'
    };

    const reminders = {
      useDefault: row.reminders_use_default ?? true,
      overrides: Array.isArray(row.reminders_overrides)
        ? row.reminders_overrides
        : undefined,
    };

    return new Activity(
      row.id?.toString() || '',
      row.id_usuario,
      row.summary || 'Sin título',
      start,
      end,
      row.event_created || now.toISOString(),
      row.event_updated || now.toISOString(),
      row.status || 'confirmed',
      details,
      row.id_etiqueta || undefined,
      'calendar#event',
      undefined,
      row.html_link || undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      row.transparency || undefined,
      row.event_type || undefined,
      row.recurrence || undefined,
      row.recurring_event_id || undefined,
      undefined,
      reminders,
      undefined,
      undefined,
      priority,
      repetition,
      // RF-03 Fields
      undefined,
      undefined,
      undefined,
      undefined,
      row.tiempo_descanso_min || undefined,
      row.tiempo_muerto_min || undefined,
      row.source || 'local',
      row.google_event_id || undefined,
      undefined
    );
  }
}
