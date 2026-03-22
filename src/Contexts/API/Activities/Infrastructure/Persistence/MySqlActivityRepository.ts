import { Activity } from '../../Domain/Activity.js';
import type { IActivityRepository } from '../../Domain/ActivityRepository.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';
import { ActivityDetails } from '../../Domain/ActivityDetails.js';
import { ActivityPriority, PriorityLevel } from '../../Domain/ActivityPriority.js';
import type { EventDateTime, EventActor, EventReminders } from '../../Domain/Activity.js';

export interface GoogleCalendarEventInput {
  id: string;
  calendarId: string;
  status?: string;
  summary?: string;
  transparency?: 'transparent' | 'opaque';
  description?: string;
  location?: string;
  htmlLink?: string;
  organizerEmail?: string;
  recurrence?: string[];
  reminders?: EventReminders;
  frecuencia?: 'diaria' | 'semanal' | 'mensual' | 'anual';
  start?: EventDateTime;
  end?: EventDateTime;
  created?: string;
  updated?: string;
  rawPayload?: unknown;
}

export class MySqlActivityRepository implements IActivityRepository {
  private db = PostgresConnection.getInstance();

  private defaultPriorityColor(value: PriorityLevel): string {
    if (value === PriorityLevel.HIGH || value === PriorityLevel.CRITICAL) {
      return '#AB3535';
    }

    if (value === PriorityLevel.MEDIUM) {
      return '#E2761F';
    }

    return '#2FA941';
  }

  private normalizeFrecuencia(value?: string): 'diaria' | 'semanal' | 'mensual' | 'anual' | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'diaria' || normalized === 'daily') {
      return 'diaria';
    }

    if (normalized === 'semanal' || normalized === 'weekly') {
      return 'semanal';
    }

    if (normalized === 'mensual' || normalized === 'monthly') {
      return 'mensual';
    }

    if (normalized === 'anual' || normalized === 'yearly') {
      return 'anual';
    }

    return undefined;
  }

  private parseFrecuenciaFromRecurrence(recurrence?: string[]): 'diaria' | 'semanal' | 'mensual' | 'anual' | undefined {
    if (!Array.isArray(recurrence) || recurrence.length === 0) {
      return undefined;
    }

    const joined = recurrence.join(';').toUpperCase();
    if (joined.includes('FREQ=DAILY')) {
      return 'diaria';
    }

    if (joined.includes('FREQ=WEEKLY')) {
      return 'semanal';
    }

    if (joined.includes('FREQ=MONTHLY')) {
      return 'mensual';
    }

    if (joined.includes('FREQ=YEARLY')) {
      return 'anual';
    }

    return undefined;
  }

  private toDbPriorityValue(value: PriorityLevel): 'baja' | 'media' | 'alta' {
    if (value === PriorityLevel.HIGH || value === PriorityLevel.CRITICAL) {
      return 'alta';
    }

    if (value === PriorityLevel.MEDIUM) {
      return 'media';
    }

    return 'baja';
  }

  private toDomainPriorityLevel(value: unknown): PriorityLevel | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'alta') {
      return PriorityLevel.HIGH;
    }

    if (normalized === 'media') {
      return PriorityLevel.MEDIUM;
    }

    if (normalized === 'baja') {
      return PriorityLevel.LOW;
    }

    if (normalized === 'high') {
      return PriorityLevel.HIGH;
    }

    if (normalized === 'medium') {
      return PriorityLevel.MEDIUM;
    }

    if (normalized === 'low') {
      return PriorityLevel.LOW;
    }

    if (normalized === 'critical') {
      return PriorityLevel.CRITICAL;
    }

    return undefined;
  }

  private async upsertActivityDetails(client: any, activityId: string, activity: Activity): Promise<void> {
    if (!activity.details) {
      return;
    }

    await client.query(
      `INSERT INTO actividades_detalles (
         id_actividad,
         description,
         ical_uid,
         recurrence,
         reminders_use_default,
         reminders_overrides,
         raw_payload,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (id_actividad) DO UPDATE
       SET description = EXCLUDED.description,
           ical_uid = EXCLUDED.ical_uid,
           recurrence = EXCLUDED.recurrence,
           reminders_use_default = EXCLUDED.reminders_use_default,
           reminders_overrides = EXCLUDED.reminders_overrides,
           raw_payload = EXCLUDED.raw_payload,
           updated_at = NOW()`,
      [
        activityId,
        activity.details.description || null,
        activity.iCalUID || null,
        activity.recurrence ? JSON.stringify(activity.recurrence) : null,
        activity.reminders?.useDefault ?? true,
        activity.reminders?.overrides ? JSON.stringify(activity.reminders.overrides) : null,
        null,
      ]
    );
  }

  private async replaceActivityPriority(client: any, activityId: string, activity: Activity): Promise<void> {
    await client.query('DELETE FROM prioridad WHERE id_actividad = $1', [activityId]);

    if (!activity.priority) {
      return;
    }

    await client.query(
      `INSERT INTO prioridad (id_actividad, valor, color)
       VALUES ($1, $2, $3)`,
      [
        activityId,
        this.toDbPriorityValue(activity.priority.valor),
        activity.priority.color || this.defaultPriorityColor(activity.priority.valor),
      ]
    );
  }

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
          transparency,
          event_type,
          recurring_event_id,
          recurrence,
          frecuencia,
          source,
          last_synced_at
         ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) 
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
          activity.transparency || null,
          activity.eventType || null,
          activity.recurringEventId || null,
          activity.recurrence || null,
          this.normalizeFrecuencia(activity.frecuencia),
          activity.source || 'local',
          activity.source === 'google' ? new Date().toISOString() : null
        ]
      );
      const activityId = activityResult.rows[0]?.id;

      if (activityId) {
        await this.upsertActivityDetails(client, activityId, activity);
        await this.replaceActivityPriority(client, activityId, activity);
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
      `SELECT ac.*, 
              ad.id as detalle_id, ad.description, ad.reminders_use_default, ad.reminders_overrides,
                p.id as prioridad_id, p.valor as prioridad_valor, p.color as prioridad_color,
              e.id as etiqueta_id, e.nombre as etiqueta_nombre, NULL::character varying as etiqueta_transparencia, e.color as etiqueta_color
       FROM actividades_completa ac
       LEFT JOIN actividades_detalles ad ON ac.id = ad.id_actividad
       LEFT JOIN prioridad p ON ac.id = p.id_actividad
        LEFT JOIN etiquetas e ON ac.id_etiqueta = e.id
       WHERE ac.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToActivity(result.rows[0]);
  }

  async findByGoogleEventId(googleEventId: string): Promise<Activity | null> {
    const result = await this.db.query(
      `SELECT ac.*, 
              ad.id as detalle_id, ad.description, ad.reminders_use_default, ad.reminders_overrides,
                p.id as prioridad_id, p.valor as prioridad_valor, p.color as prioridad_color,
              e.id as etiqueta_id, e.nombre as etiqueta_nombre, NULL::character varying as etiqueta_transparencia, e.color as etiqueta_color
       FROM actividades_completa ac
       LEFT JOIN actividades_detalles ad ON ac.id = ad.id_actividad
       LEFT JOIN prioridad p ON ac.id = p.id_actividad
        LEFT JOIN etiquetas e ON ac.id_etiqueta = e.id
       WHERE ac.google_event_id = $1
       LIMIT 1`,
      [googleEventId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToActivity(result.rows[0]);
  }

  async findByUserId(idUsuario: string): Promise<Activity[]> {
    const result = await this.db.query(
      `SELECT ac.*, 
              ad.id as detalle_id, ad.description, ad.reminders_use_default, ad.reminders_overrides,
                p.id as prioridad_id, p.valor as prioridad_valor, p.color as prioridad_color,
              e.id as etiqueta_id, e.nombre as etiqueta_nombre, NULL::character varying as etiqueta_transparencia, e.color as etiqueta_color
       FROM actividades_completa ac
       LEFT JOIN actividades_detalles ad ON ac.id = ad.id_actividad
       LEFT JOIN prioridad p ON ac.id = p.id_actividad
        LEFT JOIN etiquetas e ON ac.id_etiqueta = e.id
       WHERE ac.id_usuario = $1
       ORDER BY ac.event_created DESC`,
      [idUsuario]
    );

    return result.rows.map((row: any) => this.mapRowToActivity(row));
  }

  async findByUserIdAndDate(idUsuario: string, date: Date): Promise<Activity[]> {
    const targetDate = date.toISOString().split('T')[0];
    
    const result = await this.db.query(
      `SELECT ac.*, 
              ad.id as detalle_id, ad.description, ad.reminders_use_default, ad.reminders_overrides,
              p.id as prioridad_id, p.valor as prioridad_valor, p.color as prioridad_color,
              e.id as etiqueta_id, e.nombre as etiqueta_nombre, NULL::character varying as etiqueta_transparencia, e.color as etiqueta_color
       FROM actividades_completa ac
       LEFT JOIN actividades_detalles ad ON ac.id = ad.id_actividad
       LEFT JOIN prioridad p ON ac.id = p.id_actividad
       LEFT JOIN etiquetas e ON ac.id_etiqueta = e.id
       WHERE ac.id_usuario = $1 
         AND (ac.start_date = $2 OR DATE(ac.start_datetime) = $2)
       ORDER BY ac.start_datetime DESC`,
      [idUsuario, targetDate]
    );

    return result.rows.map((row: any) => this.mapRowToActivity(row));
  }

  async findByTagId(idEtiqueta: number): Promise<Activity[]> {
    const result = await this.db.query(
      `SELECT ac.*, 
              ad.id as detalle_id, ad.description, ad.reminders_use_default, ad.reminders_overrides,
                p.id as prioridad_id, p.valor as prioridad_valor, p.color as prioridad_color,
              e.id as etiqueta_id, e.nombre as etiqueta_nombre, NULL::character varying as etiqueta_transparencia, e.color as etiqueta_color
       FROM actividades_completa ac
       LEFT JOIN actividades_detalles ad ON ac.id = ad.id_actividad
       LEFT JOIN prioridad p ON ac.id = p.id_actividad
        LEFT JOIN etiquetas e ON ac.id_etiqueta = e.id
       WHERE ac.id_etiqueta = $1
       ORDER BY ac.event_created DESC`,
      [idEtiqueta]
    );

    return result.rows.map((row: any) => this.mapRowToActivity(row));
  }

  async update(activity: Activity): Promise<void> {
    const client = this.db.getPool();

    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE actividades
         SET id_etiqueta = $1,
             google_event_id = $2,
             summary = $3,
             status = $4,
             start_datetime = $5,
             end_datetime = $6,
             start_date = $7,
             end_date = $8,
             event_updated = $9,
             source = $10,
             last_synced_at = $11,
             transparency = $12,
             event_type = $13,
             recurring_event_id = $14,
             recurrence = $15,
             frecuencia = $16,
             updated_at = NOW()
           WHERE id = $17 AND id_usuario = $18`,
        [
          activity.idEtiqueta || null,
          activity.googleEventId || null,
          activity.summary || 'Sin título',
          activity.status || 'confirmed',
          activity.start.dateTime || null,
          activity.end.dateTime || null,
          activity.start.date || null,
          activity.end.date || null,
          activity.updated || new Date().toISOString(),
          activity.source || 'local',
          activity.source === 'google' ? new Date().toISOString() : null,
          activity.transparency || null,
          activity.eventType || null,
          activity.recurringEventId || null,
          activity.recurrence || null,
          this.normalizeFrecuencia(activity.frecuencia),
          activity.id,
          activity.idUsuario,
        ]
      );

      await this.upsertActivityDetails(client, activity.id, activity);
      await this.replaceActivityPriority(client, activity.id, activity);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error actualizando actividad:', error);
      throw error;
    }
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
    const transparency = event.transparency === 'transparent' ? 'transparent' : 'opaque';
    const frecuencia = this.normalizeFrecuencia(event.frecuencia) ?? this.parseFrecuenciaFromRecurrence(event.recurrence);
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
         transparency,
         recurrence,
         frecuencia,
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
         $14,
         $15,
         $16,
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
         transparency = EXCLUDED.transparency,
         recurrence = EXCLUDED.recurrence,
         frecuencia = EXCLUDED.frecuencia,
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
        transparency,
        event.recurrence || null,
        frecuencia || null,
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
         ical_uid,
         recurrence,
         reminders_use_default,
         reminders_overrides,
         raw_payload
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id_actividad)
       DO UPDATE SET
         description = EXCLUDED.description,
         ical_uid = EXCLUDED.ical_uid,
         recurrence = EXCLUDED.recurrence,
         reminders_use_default = EXCLUDED.reminders_use_default,
         reminders_overrides = EXCLUDED.reminders_overrides,
         raw_payload = EXCLUDED.raw_payload`,
      [
        activityId,
        event.description || null,
        event.iCalUID || null,
        event.recurrence ? JSON.stringify(event.recurrence) : null,
        event.reminders?.useDefault ?? true,
        event.reminders?.overrides ? JSON.stringify(event.reminders.overrides) : null,
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
    const toIsoString = (value: unknown): string | undefined => {
      if (!value) {
        return undefined;
      }

      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          return undefined;
        }

        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
      }

      return undefined;
    };

    const details = new ActivityDetails(
      Number(row.detalle_id || 1),
      row.id?.toString() || '',
      row.summary || 'Sin título',
      row.description || undefined,
      row.location || undefined
    );

    let priority: ActivityPriority | undefined;
    const priorityLevel = this.toDomainPriorityLevel(row.prioridad_valor);
    if (priorityLevel) {
      priority = new ActivityPriority(
        Number(row.prioridad_id || 1),
        row.id?.toString() || '',
        priorityLevel,
        row.prioridad_color || this.defaultPriorityColor(priorityLevel)
      );
    }

    // Crear fechas de inicio y fin
    const now = new Date();
    const startDateTime = toIsoString(row.start_datetime);
    const endDateTime = toIsoString(row.end_datetime);
    const createdAt = toIsoString(row.event_created) || now.toISOString();
    const updatedAt = toIsoString(row.event_updated) || now.toISOString();

    const start: EventDateTime = {
      dateTime: startDateTime,
      date: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : undefined,
      timeZone: row.start_timezone || 'UTC'
    };

    const end: EventDateTime = {
      dateTime: endDateTime,
      date: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : undefined,
      timeZone: row.end_timezone || 'UTC'
    };

    const reminderOverrides =
      typeof row.reminders_overrides === 'string'
        ? (() => {
            try {
              return JSON.parse(row.reminders_overrides);
            } catch {
              return undefined;
            }
          })()
        : row.reminders_overrides;

    const reminders = {
      useDefault: row.reminders_use_default ?? true,
      overrides: Array.isArray(reminderOverrides)
        ? reminderOverrides
        : undefined,
    };

    const etiqueta = row.etiqueta_id
      ? {
          id: Number(row.etiqueta_id),
          nombre: row.etiqueta_nombre || null,
          transparencia: row.etiqueta_transparencia || null,
          color: row.etiqueta_color || null,
        }
      : undefined;

    const prioridad = row.prioridad_valor
      ? {
          valor: row.prioridad_valor,
          color: row.prioridad_color || '#FFC107',
        }
      : undefined;

    return new Activity(
      row.id?.toString() || '',
      row.id_usuario,
      row.summary || 'Sin título',
      start,
      end,
      createdAt,
      updatedAt,
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
      row.transparency || undefined,
      row.event_type || undefined,
      row.recurrence || undefined,
      row.recurring_event_id || undefined,
      undefined,
      reminders,
      etiqueta,
      prioridad,
      priority,
      undefined,
      // RF-03 Fields
      undefined,
      undefined,
      undefined,
      undefined,
      row.source || 'local',
      row.google_event_id || undefined,
      this.normalizeFrecuencia(row.frecuencia) ?? this.parseFrecuenciaFromRecurrence(row.recurrence) ?? undefined
    );
  }
}
