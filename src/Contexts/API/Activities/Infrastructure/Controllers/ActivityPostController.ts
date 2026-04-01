import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { CreateActivityUseCase } from '../../Application/CreateActivity.js';
import { SearchUserActivitiesUseCase } from '../../Application/SearchUserActivities.js';
import type { CreateActivityRequest } from '../../Application/CreateActivity.js';
import type { IActivityRepository } from '../../Domain/ActivityRepository.js';
import type { EventActor, EventDateTime, EventReminders } from '../../Domain/Activity.js';
import { Activity } from '../../Domain/Activity.js';
import { ActivityDetails } from '../../Domain/ActivityDetails.js';
import { ActivityPriority, PriorityLevel } from '../../Domain/ActivityPriority.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';

interface GoogleConnectionRecord {
  idUsuario: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: Date;
  isActive: boolean;
}

type LocalFrecuencia = 'diaria' | 'semanal' | 'mensual' | 'anual';

export class ActivityPostController {
  private db = PostgresConnection.getInstance();

  constructor(
    private createActivityUseCase: CreateActivityUseCase,
    private searchActivityUseCase: SearchUserActivitiesUseCase,
    private activityRepository: IActivityRepository
  ) {}

  private async resolveUserId(req: Request): Promise<string | null> {
    const authUser = (req as any).user as
      | { id?: string; clerkUserId?: string; correo?: string }
      | undefined;

    if (authUser?.id) {
      return authUser.id;
    }

    if (authUser?.clerkUserId) {
      const byClerk = await this.db.query(
        'SELECT id FROM usuarios WHERE clerk_user_id = $1',
        [authUser.clerkUserId]
      );
      if (byClerk.rows.length > 0) {
        return byClerk.rows[0].id;
      }
    }

    if (authUser?.correo) {
      const byMail = await this.db.query('SELECT id FROM usuarios WHERE correo = $1', [authUser.correo]);
      if (byMail.rows.length > 0) {
        return byMail.rows[0].id;
      }
    }

    return null;
  }

  private async resolveUserParamToInternalId(userIdParam: string): Promise<string | null> {
    if (!userIdParam || userIdParam.trim().length === 0) {
      return null;
    }

    if (userIdParam.startsWith('user_')) {
      const byClerk = await this.db.query(
        'SELECT id FROM usuarios WHERE clerk_user_id = $1',
        [userIdParam]
      );
      if (byClerk.rows.length > 0) {
        return byClerk.rows[0].id;
      }
    }

    return userIdParam;
  }

  private normalizePriorityValue(value?: string): 'baja' | 'media' | 'alta' | undefined {
    if (!value) {
      return undefined;
    }
    const normalized = value.toLowerCase();
    if (normalized === 'alta') {
      return 'alta';
    }
    if (normalized === 'media') {
      return 'media';
    }
    if (normalized === 'baja') {
      return 'baja';
    }
    return undefined;
  }

  private defaultPriorityColor(value?: 'baja' | 'media' | 'alta'): string | undefined {
    if (!value) {
      return undefined;
    }
    if (value === 'alta') {
      return '#AB3535';
    }
    if (value === 'media') {
      return '#E2761F';
    }
    return '#2FA941';
  }

  private normalizeGoogleFrequency(value: unknown): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        return undefined;
      }

      if (normalized === 'diaria' || normalized === 'daily') {
        return 'DAILY';
      }

      if (normalized === 'semanal' || normalized === 'weekly') {
        return 'WEEKLY';
      }

      if (normalized === 'mensual' || normalized === 'monthly') {
        return 'MONTHLY';
      }

      if (normalized === 'anual' || normalized === 'yearly') {
        return 'YEARLY';
      }
    }

    if (typeof value === 'number') {
      if (value === 1) {
        return 'DAILY';
      }
      if (value === 2) {
        return 'WEEKLY';
      }
      if (value === 3) {
        return 'MONTHLY';
      }
      if (value === 4) {
        return 'YEARLY';
      }
    }

    return undefined;
  }

  private normalizeTransparency(value: unknown): 'transparent' | 'opaque' | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'transparent') {
      return 'transparent';
    }

    if (normalized === 'opaque') {
      return 'opaque';
    }

    return undefined;
  }

  private buildGoogleRecurrence(bodyParams: Record<string, any>): string[] | undefined {
    if (Array.isArray(bodyParams.recurrence) && bodyParams.recurrence.length > 0) {
      return bodyParams.recurrence;
    }

    const frequency = this.normalizeGoogleFrequency(bodyParams.frecuencia ?? bodyParams.idFrecuencia);
    if (!frequency) {
      return undefined;
    }

    const parts: string[] = [`FREQ=${frequency}`];

    if (frequency === 'WEEKLY' && typeof bodyParams.diasSemana === 'string') {
      const byDay = bodyParams.diasSemana
        .split(',')
        .map((value: string) => value.trim().toUpperCase().slice(0, 3))
        .filter((value: string) => ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].includes(value));

      if (byDay.length > 0) {
        parts.push(`BYDAY=${byDay.join(',')}`);
      }
    }

    const rawUntil = bodyParams.fechaFin;
    if (typeof rawUntil === 'string') {
      const parsedUntil = new Date(rawUntil);
      if (!Number.isNaN(parsedUntil.getTime())) {
        parts.push(`UNTIL=${parsedUntil.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`);
      }
    }

    return [`RRULE:${parts.join(';')}`];
  }

  private toLocalFrecuencia(value: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'): LocalFrecuencia {
    if (value === 'DAILY') {
      return 'diaria';
    }

    if (value === 'WEEKLY') {
      return 'semanal';
    }

    if (value === 'MONTHLY') {
      return 'mensual';
    }

    return 'anual';
  }

  private parseRecurrenceRule(
    recurrence?: string[]
  ): { frecuencia?: LocalFrecuencia; diasSemana?: string; until?: string } {
    if (!Array.isArray(recurrence) || recurrence.length === 0) {
      return {};
    }

    const rruleLine = recurrence.find(
      (value) => typeof value === 'string' && value.trim().toUpperCase().startsWith('RRULE:')
    );

    if (!rruleLine) {
      return {};
    }

    const parts = rruleLine
      .trim()
      .replace(/^RRULE:/i, '')
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    let frecuencia: LocalFrecuencia | undefined;
    let diasSemana: string | undefined;
    let until: string | undefined;

    for (const part of parts) {
      const [rawKey, rawValue] = part.split('=');
      const key = rawKey?.toUpperCase();
      const value = rawValue?.toUpperCase();

      if (!key || !value) {
        continue;
      }

      if (key === 'FREQ') {
        if (value === 'DAILY') {
          frecuencia = 'diaria';
        } else if (value === 'WEEKLY') {
          frecuencia = 'semanal';
        } else if (value === 'MONTHLY') {
          frecuencia = 'mensual';
        } else if (value === 'YEARLY') {
          frecuencia = 'anual';
        }
      }

      if (key === 'BYDAY') {
        diasSemana = value;
      }

      if (key === 'UNTIL') {
        until = value;
      }
    }

    return { frecuencia, diasSemana, until };
  }

  private resolveLocalFrecuencia(
    value: unknown,
    recurrence?: string[]
  ): LocalFrecuencia | undefined {
    const normalized = this.normalizeGoogleFrequency(value);
    if (normalized) {
      return this.toLocalFrecuencia(normalized);
    }

    return this.parseRecurrenceRule(recurrence).frecuencia;
  }

  private parseHour(date?: EventDateTime): number | undefined {
    if (!date?.dateTime) {
      return undefined;
    }
    const parsed = new Date(date.dateTime);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    return parsed.getHours();
  }

  private mergeEventDateTime(
    base: EventDateTime | undefined,
    override: EventDateTime | undefined
  ): EventDateTime | undefined {
    if (!base && !override) {
      return undefined;
    }

    return {
      dateTime: override?.dateTime ?? base?.dateTime,
      date: override?.date ?? base?.date,
      timeZone: override?.timeZone ?? base?.timeZone,
    };
  }

  private keepExistingTimeZone(
    existing: EventDateTime | undefined,
    merged: EventDateTime | undefined
  ): EventDateTime | undefined {
    if (!merged) {
      return undefined;
    }

    return {
      dateTime: merged.dateTime,
      date: merged.date,
      // La zona horaria se mantiene fija en updates para evitar desplazamientos de horario.
      timeZone: existing?.timeZone ?? merged.timeZone,
    };
  }

  private toGoogleDateTime(date: EventDateTime): Record<string, unknown> {
    if (date.dateTime) {
      const result: Record<string, unknown> = { dateTime: date.dateTime };
      if (date.timeZone) {
        result.timeZone = date.timeZone;
      }
      return result;
    }

    if (date.date) {
      const result: Record<string, unknown> = { date: date.date };
      if (date.timeZone) {
        result.timeZone = date.timeZone;
      }
      return result;
    }

    return {};
  }

  private toGoogleEventPayload(activity: Activity): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      summary: activity.summary,
      status: activity.status,
      start: this.toGoogleDateTime(activity.start),
      end: this.toGoogleDateTime(activity.end),
      transparency: activity.transparency ?? 'opaque',
    };

    if (typeof activity.details.description === 'string') {
      payload.description = activity.details.description;
    }

    if (activity.recurrence) {
      if (activity.recurrence.length > 0) {
        payload.recurrence = activity.recurrence;
      } else {
        payload.recurrence = null;
      }
    }

    if (activity.reminders) {
      payload.reminders = activity.reminders;
    }

    return payload;
  }

  private defaultWeekDays(): string {
    return 'MON,TUE,WED,THU,FRI,SAT,SUN';
  }

  private toPriorityLevel(value: 'baja' | 'media' | 'alta'): PriorityLevel {
    if (value === 'alta') {
      return PriorityLevel.HIGH;
    }

    if (value === 'media') {
      return PriorityLevel.MEDIUM;
    }

    return PriorityLevel.LOW;
  }

  private resolveUpdatedCategoryId(existing: Activity, bodyParams: Record<string, any>): number | null | undefined {
    if (!Object.prototype.hasOwnProperty.call(bodyParams, 'idEtiqueta')) {
      return existing.idEtiqueta;
    }

    const incoming = bodyParams.idEtiqueta;
    if (incoming === null) {
      return null;
    }

    if (typeof incoming === 'number' && Number.isInteger(incoming) && incoming > 0) {
      return incoming;
    }

    return existing.idEtiqueta;
  }

  private resolveUpdatedPriority(existing: Activity, bodyParams: Record<string, any>): ActivityPriority | undefined {
    const hasPriorityPayload =
      Object.prototype.hasOwnProperty.call(bodyParams, 'prioridadValor') ||
      Object.prototype.hasOwnProperty.call(bodyParams, 'prioridadNivel') ||
      Object.prototype.hasOwnProperty.call(bodyParams, 'prioridad') ||
      Object.prototype.hasOwnProperty.call(bodyParams, 'color');

    if (!hasPriorityPayload) {
      return existing.priority;
    }

    const shouldRemovePriority =
      bodyParams.prioridadValor === null ||
      bodyParams.prioridadNivel === null ||
      bodyParams.prioridad === null;
    if (shouldRemovePriority) {
      return undefined;
    }

    const normalizedPriority = this.normalizePriorityValue(
      bodyParams.prioridadValor ??
        bodyParams.prioridadNivel ??
        (typeof bodyParams.prioridad === 'string' ? bodyParams.prioridad : undefined)
    );

    const normalizedColor =
      typeof bodyParams.color === 'string' && bodyParams.color.trim().length > 0
        ? bodyParams.color
        : undefined;

    if (normalizedPriority) {
      const color = normalizedColor ?? existing.priority?.color ?? this.defaultPriorityColor(normalizedPriority) ?? '#2FA941';
      return new ActivityPriority(existing.priority?.id ?? 1, existing.id, this.toPriorityLevel(normalizedPriority), color);
    }

    if (normalizedColor && existing.priority) {
      return new ActivityPriority(existing.priority.id, existing.id, existing.priority.valor, normalizedColor);
    }

    return existing.priority;
  }

  private parseFrequencyId(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return undefined;
  }

  private parseDateValue(value: unknown): Date | undefined {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return undefined;
  }

  private async getGoogleConnectionByUserId(idUsuario: string): Promise<GoogleConnectionRecord | null> {
    const result = await this.db.query(
      `SELECT id_usuario, access_token, refresh_token, token_type, scope, expires_at, is_active
       FROM user_google_connections
       WHERE id_usuario = $1 AND is_active = TRUE`,
      [idUsuario]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      idUsuario: row.id_usuario,
      accessToken: row.access_token || undefined,
      refreshToken: row.refresh_token || undefined,
      tokenType: row.token_type || undefined,
      scope: row.scope || undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      isActive: Boolean(row.is_active),
    };
  }

  private async saveGoogleConnectionToken(idUsuario: string, accessToken: string, expiresAt?: Date): Promise<void> {
    await this.db.query(
      `UPDATE user_google_connections
       SET access_token = $1,
           expires_at = $2,
           updated_at = NOW()
       WHERE id_usuario = $3`,
      [accessToken, expiresAt || null, idUsuario]
    );

    await this.db.query(
      `UPDATE usuarios
       SET token_google = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [accessToken, idUsuario]
    );
  }

  private computeExpiresAt(expiresIn?: number): Date | undefined {
    if (!expiresIn || Number.isNaN(expiresIn)) {
      return undefined;
    }
    return new Date(Date.now() + expiresIn * 1000);
  }

  private async refreshGoogleAccessToken(connection: GoogleConnectionRecord): Promise<{ accessToken: string; expiresAt?: Date }> {
    if (!connection.refreshToken) {
      throw new Error('La conexión Google no tiene refresh_token para renovar acceso');
    }

    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: connection.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!response.ok || !payload.access_token) {
      const rawMessage = payload.error_description || payload.error || 'No se pudo renovar token de Google';
      const normalized = rawMessage.toLowerCase();
      if (normalized.includes('invalid_grant') || normalized.includes('revoked') || normalized.includes('expired')) {
        throw new Error('La sesion de Google expiro o fue revocada. Reconecta tu cuenta de Google Calendar.');
      }
      throw new Error(rawMessage);
    }

    return {
      accessToken: payload.access_token,
      expiresAt: this.computeExpiresAt(payload.expires_in),
    };
  }

  private async getValidGoogleAccessToken(connection: GoogleConnectionRecord): Promise<string> {
    if (!connection.accessToken) {
      const refreshed = await this.refreshGoogleAccessToken(connection);
      await this.saveGoogleConnectionToken(connection.idUsuario, refreshed.accessToken, refreshed.expiresAt);
      return refreshed.accessToken;
    }

    const isExpired =
      connection.expiresAt instanceof Date &&
      !Number.isNaN(connection.expiresAt.getTime()) &&
      connection.expiresAt.getTime() - Date.now() < 60_000;

    if (!isExpired && connection.accessToken) {
      return connection.accessToken;
    }

    const refreshed = await this.refreshGoogleAccessToken(connection);
    await this.saveGoogleConnectionToken(connection.idUsuario, refreshed.accessToken, refreshed.expiresAt);
    return refreshed.accessToken;
  }

  private isGoogleAuthError(status: number, message?: string): boolean {
    if (status === 401) {
      return true;
    }

    const normalized = (message || '').toLowerCase();
    return (
      normalized.includes('invalid credentials') ||
      normalized.includes('token has been expired') ||
      normalized.includes('expired or revoked') ||
      normalized.includes('invalid_grant') ||
      normalized.includes('revoked')
    );
  }

  private async refreshAndPersistGoogleAccessToken(connection: GoogleConnectionRecord): Promise<string> {
    const refreshed = await this.refreshGoogleAccessToken(connection);
    await this.saveGoogleConnectionToken(connection.idUsuario, refreshed.accessToken, refreshed.expiresAt);
    return refreshed.accessToken;
  }

  private async createGoogleEventForActivity(activity: Activity): Promise<{ id?: string; htmlLink?: string }> {
    const connection = await this.getGoogleConnectionByUserId(activity.idUsuario);
    if (!connection || !connection.isActive) {
      return {};
    }

    let accessToken = await this.getValidGoogleAccessToken(connection);
    const endpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    let response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.toGoogleEventPayload(activity)),
    });

    let payload = (await response.json()) as {
      id?: string;
      htmlLink?: string;
      error?: { message?: string };
    };

    if (!response.ok && this.isGoogleAuthError(response.status, payload.error?.message)) {
      accessToken = await this.refreshAndPersistGoogleAccessToken(connection);
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.toGoogleEventPayload(activity)),
      });
      payload = (await response.json()) as {
        id?: string;
        htmlLink?: string;
        error?: { message?: string };
      };
    }

    if (!response.ok) {
      throw new Error(payload.error?.message || 'No se pudo crear evento en Google Calendar');
    }

    return {
      id: payload.id,
      htmlLink: payload.htmlLink,
    };
  }

  private async deleteGoogleEventForActivity(activity: Activity): Promise<void> {
    if (!activity.googleEventId) {
      return;
    }

    const connection = await this.getGoogleConnectionByUserId(activity.idUsuario);
    if (!connection || !connection.isActive) {
      return;
    }

    let accessToken = await this.getValidGoogleAccessToken(connection);
    const endpoint = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(activity.googleEventId)}`;
    let response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && this.isGoogleAuthError(response.status)) {
      accessToken = await this.refreshAndPersistGoogleAccessToken(connection);
      response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    if (!response.ok && response.status !== 404 && response.status !== 410) {
      const payload = (await response.json()) as { error?: { message?: string } };
      throw new Error(payload.error?.message || 'No se pudo eliminar evento en Google Calendar');
    }
  }

  private async updateGoogleEventForActivity(activity: Activity): Promise<{ id?: string; htmlLink?: string }> {
    if (!activity.googleEventId) {
      return this.createGoogleEventForActivity(activity);
    }

    const connection = await this.getGoogleConnectionByUserId(activity.idUsuario);
    if (!connection || !connection.isActive) {
      return {};
    }

    let accessToken = await this.getValidGoogleAccessToken(connection);
    const endpoint = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(activity.googleEventId)}`;
    let response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.toGoogleEventPayload(activity)),
    });

    let payload = (await response.json()) as {
      id?: string;
      htmlLink?: string;
      error?: { message?: string };
    };

    if (!response.ok && this.isGoogleAuthError(response.status, payload.error?.message)) {
      accessToken = await this.refreshAndPersistGoogleAccessToken(connection);
      response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.toGoogleEventPayload(activity)),
      });
      payload = (await response.json()) as {
        id?: string;
        htmlLink?: string;
        error?: { message?: string };
      };
    }

    if (!response.ok) {
      throw new Error(payload.error?.message || 'No se pudo actualizar evento en Google Calendar');
    }

    return {
      id: payload.id,
      htmlLink: payload.htmlLink,
    };
  }

  private buildUpdatedActivity(existing: Activity, bodyParams: Record<string, any>): Activity {
    const summary = bodyParams.summary ?? existing.summary;
    const normalizedRecurrence = this.buildGoogleRecurrence(bodyParams) ?? bodyParams.recurrence ?? existing.recurrence;
    const normalizedFrecuencia =
      this.resolveLocalFrecuencia(bodyParams.frecuencia ?? bodyParams.idFrecuencia, normalizedRecurrence) ??
      existing.frecuencia;
    const normalizedTransparency =
      this.normalizeTransparency(bodyParams.transparency) ?? existing.transparency ?? 'opaque';
    const updatedCategoryId = this.resolveUpdatedCategoryId(existing, bodyParams);
    const updatedPriority = this.resolveUpdatedPriority(existing, bodyParams);
    const start = this.keepExistingTimeZone(
      existing.start,
      this.mergeEventDateTime(existing.start, bodyParams.start as EventDateTime | undefined)
    );
    const end = this.keepExistingTimeZone(
      existing.end,
      this.mergeEventDateTime(existing.end, bodyParams.end as EventDateTime | undefined)
    );

    if (!start || !end) {
      throw new Error('summary, start y end son obligatorios');
    }

    const details = new ActivityDetails(
      existing.details.id,
      existing.id,
      summary,
      bodyParams.description ?? existing.details.description
    );

    return new Activity(
      existing.id,
      existing.idUsuario,
      summary,
      start,
      end,
      existing.created,
      new Date().toISOString(),
      bodyParams.status ?? existing.status,
      details,
      updatedCategoryId as any,
      bodyParams.kind ?? existing.kind,
      bodyParams.etag ?? existing.etag,
      bodyParams.htmlLink ?? existing.htmlLink,
      (bodyParams.creator as EventActor | undefined) ?? existing.creator,
      (bodyParams.organizer as EventActor | undefined) ?? existing.organizer,
      bodyParams.iCalUID ?? existing.iCalUID,
      bodyParams.sequence ?? existing.sequence,
      normalizedTransparency,
      bodyParams.eventType ?? existing.eventType,
      normalizedRecurrence,
      bodyParams.recurringEventId ?? existing.recurringEventId,
      (bodyParams.originalStartTime as EventDateTime | undefined) ?? existing.originalStartTime,
      (bodyParams.reminders as EventReminders | undefined) ?? existing.reminders,
      bodyParams.etiqueta ?? existing.etiqueta,
      bodyParams.prioridad ?? existing.prioridad,
      updatedPriority,
      bodyParams.fechaInicio ? new Date(bodyParams.fechaInicio) : existing.fechaInicio,
      bodyParams.fechaFin ? new Date(bodyParams.fechaFin) : existing.fechaFin,
      bodyParams.horaInicio ?? existing.horaInicio ?? this.parseHour(start),
      bodyParams.horaFin ?? existing.horaFin ?? this.parseHour(end),
      bodyParams.source ?? existing.source,
      existing.googleEventId,
      normalizedFrecuencia
    );
  }

  private async saveGoogleEventLink(activityId: string, idUsuario: string, googleEventId: string, htmlLink?: string): Promise<void> {
    await this.db.query(
      `UPDATE actividades
       SET google_event_id = $1,
           google_calendar_id = 'primary',
           last_synced_at = NOW(),
           updated_at = NOW()
       WHERE id = $2 AND id_usuario = $3`,
      [googleEventId, activityId, idUsuario]
    );
  }

  private toCalendarEvent(activity: Activity): Record<string, unknown> {
    const normalizedPriority = activity.priority
      ? {
          valor: activity.priority.valor,
          color: activity.priority.color,
        }
      : undefined;

    const recurrenceInfo = this.parseRecurrenceRule(activity.recurrence);
    const frecuencia = activity.frecuencia ?? recurrenceInfo.frecuencia ?? null;

    return {
      id: activity.googleEventId || activity.id,
      localId: activity.id,
      kind: activity.kind,
      etag: activity.etag,
      htmlLink: activity.htmlLink,
      idUsuario: activity.idUsuario,
      idEtiqueta: activity.idEtiqueta,
      summary: activity.summary,
      creator: activity.creator,
      organizer: activity.organizer,
      status: activity.status,
      start: activity.start,
      end: activity.end,
      description: activity.details.description ?? null,
      iCalUID: activity.iCalUID,
      sequence: activity.sequence,
      transparency: activity.transparency ?? 'opaque',
      eventType: activity.eventType,
      source: activity.source,
      recurrence: activity.recurrence ?? null,
      frecuencia,
      repetition: {
        frecuencia,
        diasSemana: recurrenceInfo.diasSemana ?? null,
        fechaInicio: activity.fechaInicio?.toISOString() ?? null,
        fechaFin: activity.fechaFin?.toISOString() ?? null,
        until: recurrenceInfo.until ?? null,
      },
      recurringEventId: activity.recurringEventId,
      originalStartTime: activity.originalStartTime,
      reminders: activity.reminders ?? null,
      etiqueta: activity.etiqueta ?? (activity.idEtiqueta ? { id: activity.idEtiqueta } : null),
      prioridad: activity.prioridad ?? normalizedPriority ?? null,
      color: activity.priority?.color ?? null,
      updated: activity.updated,
      created: activity.created,
    };
  }

  private getActivityTimestamp(activity: Activity): number | null {
    const rawDate = activity.start.dateTime ?? activity.start.date;
    if (!rawDate) {
      return null;
    }

    const timestamp = Date.parse(rawDate);
    if (Number.isNaN(timestamp)) {
      return null;
    }

    return timestamp;
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const bodyParams = req.body as Record<string, any>;
      const {
        id,
        idUsuario,
        kind,
        etag,
        htmlLink,
        summary,
        creator,
        organizer,
        start,
        end,
        created,
        updated,
        iCalUID,
        sequence,
        transparency,
        eventType,
        recurrence,
        status,
        detailsId,
        description,
        location,
        idEtiqueta,
        recurringEventId,
        originalStartTime,
        reminders,
        etiqueta,
        priorityId,
        prioridad,
        prioridadNivel,
        color,
        repetitionId,
        idFrecuencia,
        diasSemana,
        fechaInicio,
        fechaFin,
        // RF-03 Fields
        horaInicio,
        horaFin,
        source,
        googleEventId,
        frecuencia,
        prioridadValor,
      } = bodyParams;

      if (typeof idUsuario !== 'undefined') {
        res.status(400).json({
          success: false,
          message: 'No se permite enviar idUsuario en el body. Se resuelve desde el token.',
        });
        return;
      }

      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido o no disponible en el token',
        });
        return;
      }

      const resolvedActivityId = typeof id === 'string' && id.trim().length > 0 ? id : randomUUID();

      const normalizedReminders = (bodyParams.reminders ?? bodyParams.remiders) as EventReminders | undefined;
      const normalizedRecurrence = this.buildGoogleRecurrence(bodyParams);
      const normalizedFrecuencia = this.resolveLocalFrecuencia(
        bodyParams.frecuencia ?? bodyParams.idFrecuencia,
        normalizedRecurrence
      );
      const normalizedTransparency = this.normalizeTransparency(bodyParams.transparency) ?? 'opaque';
      const normalizedPriority = this.normalizePriorityValue(
        bodyParams.prioridadValor ??
          bodyParams.prioridadNivel ??
          (typeof bodyParams.prioridad === 'string' ? bodyParams.prioridad : undefined)
      );
      const normalizedColor = bodyParams.color ?? this.defaultPriorityColor(normalizedPriority);

      const startDate = bodyParams.start as EventDateTime | undefined;
      const endDate = bodyParams.end as EventDateTime | undefined;

      if (!summary || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'summary, start y end son obligatorios',
        });
        return;
      }

      // Se exige conexión activa para que create quede sincronizado a Google Calendar.
      if (bodyParams.source !== 'google') {
        const connection = await this.getGoogleConnectionByUserId(resolvedUserId);
        if (!connection || !connection.isActive) {
          res.status(409).json({
            success: false,
            message:
              'Para crear actividades desde la app se requiere Google Calendar conectado. Ejecuta /api/integrations/google/connect primero.',
          });
          return;
        }
      }

      const request: CreateActivityRequest = {
        id: resolvedActivityId,
        idUsuario: resolvedUserId,
        kind,
        etag,
        htmlLink,
        summary,
        creator: bodyParams.creator as EventActor,
        organizer: bodyParams.organizer as EventActor,
        start: startDate,
        end: endDate,
        created: bodyParams.created,
        updated: bodyParams.updated,
        iCalUID: bodyParams.iCalUID,
        sequence: bodyParams.sequence,
        transparency: normalizedTransparency,
        eventType: bodyParams.eventType,
        recurrence: normalizedRecurrence,
        status: bodyParams.status,
        detailsId: 1,
        description: bodyParams.description,
        location: bodyParams.location,
        idEtiqueta: bodyParams.idEtiqueta,
        recurringEventId: bodyParams.recurringEventId,
        originalStartTime: bodyParams.originalStartTime as EventDateTime,
        reminders: normalizedReminders,
        etiqueta: bodyParams.etiqueta,
        priorityId: undefined,
        prioridad: bodyParams.prioridad,
        prioridadNivel: undefined,
        color: normalizedColor,
        repetitionId: 1,
        idFrecuencia: bodyParams.idFrecuencia,
        diasSemana: bodyParams.diasSemana,
        // RF-03 Fields
        horaInicio: bodyParams.horaInicio ?? this.parseHour(startDate),
        horaFin: bodyParams.horaFin ?? this.parseHour(endDate),
        source: bodyParams.source ?? 'local',
        googleEventId: bodyParams.googleEventId ?? (typeof bodyParams.id === 'string' ? bodyParams.id : undefined),
        frecuencia: normalizedFrecuencia,
        prioridadValor: normalizedPriority,
      };

      if (bodyParams.fechaInicio) {
        request.fechaInicio = new Date(bodyParams.fechaInicio);
      }

      if (bodyParams.fechaFin) {
        request.fechaFin = new Date(bodyParams.fechaFin);
      }

      const activity = await this.createActivityUseCase.execute(request);

      if (activity.source !== 'google') {
        const googleEvent = await this.createGoogleEventForActivity(activity);
        if (googleEvent.id) {
          await this.saveGoogleEventLink(activity.id, activity.idUsuario, googleEvent.id, googleEvent.htmlLink);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Actividad creada correctamente',
        data: this.toCalendarEvent(activity),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de actividad inválido',
        });
        return;
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const activity = isUuid
        ? await this.searchActivityUseCase.activityById(id)
        : await this.activityRepository.findByGoogleEventId(id);
      if (!activity) {
        res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
        return;
      }

      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      if (activity.idUsuario !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para consultar esta actividad',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: this.toCalendarEvent(activity),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de actividad inválido',
        });
        return;
      }

      const bodyParams = req.body as Record<string, any>;
      if (typeof bodyParams.idUsuario !== 'undefined') {
        res.status(400).json({
          success: false,
          message: 'No se permite enviar idUsuario en el body. Se resuelve desde el token.',
        });
        return;
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const existing = isUuid
        ? await this.searchActivityUseCase.activityById(id)
        : await this.activityRepository.findByGoogleEventId(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
        return;
      }

      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      if (existing.idUsuario !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para actualizar esta actividad',
        });
        return;
      }

      const updatedActivity = this.buildUpdatedActivity(existing, bodyParams);
      await this.activityRepository.update(updatedActivity);

      const googleEvent = await this.updateGoogleEventForActivity(updatedActivity);
      if (googleEvent.id) {
        await this.saveGoogleEventLink(updatedActivity.id, updatedActivity.idUsuario, googleEvent.id, googleEvent.htmlLink);
      }

      const refreshed = await this.searchActivityUseCase.activityById(updatedActivity.id);

      res.status(200).json({
        success: true,
        message: 'Actividad actualizada correctamente',
        data: this.toCalendarEvent(refreshed ?? updatedActivity),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de actividad inválido',
        });
        return;
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const existing = isUuid
        ? await this.searchActivityUseCase.activityById(id)
        : await this.activityRepository.findByGoogleEventId(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
        return;
      }

      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      if (existing.idUsuario !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para eliminar esta actividad',
        });
        return;
      }

      if (existing.googleEventId) {
        await this.deleteGoogleEventForActivity(existing);
      }

      await this.activityRepository.delete(existing.id);

      res.status(200).json({
        success: true,
        message: 'Actividad eliminada correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getUserActivities(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.userId;
      if (!userIdParam || typeof userIdParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const requestedInternalUserId = await this.resolveUserParamToInternalId(userIdParam);
      if (!requestedInternalUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      if (requestedInternalUserId !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para consultar actividades de otro usuario',
        });
        return;
      }

      const idUsuario = requestedInternalUserId;

      const activities = await this.searchActivityUseCase.allActivitiesByUser(idUsuario);

      res.status(200).json({
        success: true,
        data: activities.map((activity: Activity) => this.toCalendarEvent(activity)),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getUserActivitiesByDate(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.userId;
      const dateParam = req.params.date;

      if (!userIdParam || typeof userIdParam !== 'string' || !dateParam || typeof dateParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario o fecha inválidos',
        });
        return;
      }

      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const requestedInternalUserId = await this.resolveUserParamToInternalId(userIdParam);
      if (!requestedInternalUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      if (requestedInternalUserId !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para consultar actividades de otro usuario',
        });
        return;
      }

      const idUsuario = requestedInternalUserId;
      const date = new Date(dateParam);

      const activities = await this.searchActivityUseCase.activitiesByUserAndDate(idUsuario, date);

      res.status(200).json({
        success: true,
        date: date.toISOString().split('T')[0],
        data: activities.map((activity: Activity) => this.toCalendarEvent(activity)),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getMyActivities(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = await this.resolveUserId(req);

      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const activities = await this.searchActivityUseCase.allActivitiesByUser(idUsuario);

      res.status(200).json({
        success: true,
        data: activities.map((activity) => this.toCalendarEvent(activity)),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getMyActivitiesByRange(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = await this.resolveUserId(req);
      if (!idUsuario) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const fromRaw = req.query.from;
      const toRaw = req.query.to;

      if (typeof fromRaw !== 'string' || typeof toRaw !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Los query params from y to son obligatorios',
        });
        return;
      }

      const fromTimestamp = Date.parse(fromRaw);
      const toTimestamp = Date.parse(toRaw);

      if (Number.isNaN(fromTimestamp) || Number.isNaN(toTimestamp)) {
        res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido para from/to',
        });
        return;
      }

      if (fromTimestamp > toTimestamp) {
        res.status(400).json({
          success: false,
          message: 'from no puede ser mayor que to',
        });
        return;
      }

      const activities = await this.searchActivityUseCase.allActivitiesByUser(idUsuario);
      const filtered = activities.filter((activity) => {
        const timestamp = this.getActivityTimestamp(activity);
        if (timestamp === null) {
          return false;
        }
        return timestamp >= fromTimestamp && timestamp <= toTimestamp;
      });

      res.status(200).json({
        success: true,
        data: filtered.map((activity) => this.toCalendarEvent(activity)),
        meta: {
          count: filtered.length,
          from: new Date(fromTimestamp).toISOString(),
          to: new Date(toTimestamp).toISOString(),
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
