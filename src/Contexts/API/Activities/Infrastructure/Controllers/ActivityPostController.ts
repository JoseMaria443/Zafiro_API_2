import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { CreateActivityUseCase } from '../../Application/CreateActivity.js';
import { SearchUserActivitiesUseCase } from '../../Application/SearchUserActivities.js';
import type { CreateActivityRequest } from '../../Application/CreateActivity.js';
import type { IActivityRepository } from '../../Domain/ActivityRepository.js';
import type { EventActor, EventDateTime, EventReminders } from '../../Domain/Activity.js';
import { Activity } from '../../Domain/Activity.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';

export class ActivityPostController {
  private db = PostgresConnection.getInstance();

  constructor(
    private createActivityUseCase: CreateActivityUseCase,
    private searchActivityUseCase: SearchUserActivitiesUseCase,
    private activityRepository: IActivityRepository
  ) {}

  private async resolveUserId(req: Request, explicitUserId?: string): Promise<string | null> {
    if (explicitUserId && explicitUserId.trim().length > 0) {
      return explicitUserId;
    }

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
        tiempoDescansoMin,
        tiempoMuertoMin,
        source,
        googleEventId,
        frecuencia,
        prioridadValor,
      } = bodyParams;

      const resolvedUserId = await this.resolveUserId(req, idUsuario);
      if (!resolvedUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido o no disponible en el token',
        });
        return;
      }

      const resolvedActivityId = typeof id === 'string' && id.trim().length > 0 ? id : randomUUID();

      const normalizedReminders = (bodyParams.reminders ?? bodyParams.remiders) as EventReminders | undefined;
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
        transparency: bodyParams.transparency,
        eventType: bodyParams.eventType,
        recurrence: bodyParams.recurrence,
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
        tiempoDescansoMin: bodyParams.tiempoDescansoMin,
        tiempoMuertoMin: bodyParams.tiempoMuertoMin,
        source: bodyParams.source ?? 'local',
        googleEventId: bodyParams.googleEventId ?? (typeof bodyParams.id === 'string' ? bodyParams.id : undefined),
        frecuencia: bodyParams.frecuencia,
        prioridadValor: normalizedPriority,
      };

      if (bodyParams.fechaInicio) {
        request.fechaInicio = new Date(bodyParams.fechaInicio);
      }

      if (bodyParams.fechaFin) {
        request.fechaFin = new Date(bodyParams.fechaFin);
      }

      const activity = await this.createActivityUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Actividad creada correctamente',
        data: {
          id: activity.id,
          kind: activity.kind,
          etag: activity.etag,
          htmlLink: activity.htmlLink,
          idUsuario: activity.idUsuario,
          idEtiqueta: activity.idEtiqueta,
          summary: activity.summary,
          creator: activity.creator,
          organizer: activity.organizer,
          start: activity.start,
          end: activity.end,
          created: activity.created,
          updated: activity.updated,
          iCalUID: activity.iCalUID,
          sequence: activity.sequence,
          transparency: activity.transparency,
          eventType: activity.eventType,
          recurrence: activity.recurrence,
          status: activity.status,
          recurringEventId: activity.recurringEventId,
          originalStartTime: activity.originalStartTime,
          reminders: activity.reminders,
          etiqueta: activity.etiqueta,
          prioridad: activity.prioridad,
          description: activity.details.description,
          location: activity.details.location,
          color: activity.priority?.color,
        },
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

      const activity = await this.searchActivityUseCase.activityById(id);
      if (!activity) {
        res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: activity,
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

      const existing = await this.searchActivityUseCase.activityById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
        return;
      }

      await this.activityRepository.delete(id);

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

      const idUsuario = userIdParam; // Keep as string, not parseInt

      const activities = await this.searchActivityUseCase.allActivitiesByUser(idUsuario);

      res.status(200).json({
        success: true,
        data: activities.map((activity: Activity) => ({
          id: activity.id,
          kind: activity.kind,
          etag: activity.etag,
          htmlLink: activity.htmlLink,
          idUsuario: activity.idUsuario,
          idEtiqueta: activity.idEtiqueta,
          summary: activity.summary,
          creator: activity.creator,
          organizer: activity.organizer,
          start: activity.start,
          end: activity.end,
          created: activity.created,
          updated: activity.updated,
          iCalUID: activity.iCalUID,
          sequence: activity.sequence,
          transparency: activity.transparency,
          eventType: activity.eventType,
          recurrence: activity.recurrence,
          status: activity.status,
          recurringEventId: activity.recurringEventId,
          originalStartTime: activity.originalStartTime,
          reminders: activity.reminders,
          etiqueta: activity.etiqueta,
          prioridad: activity.prioridad,
          description: activity.details.description,
          location: activity.details.location,
          color: activity.priority?.color,
        })),
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

      const idUsuario = userIdParam; // Keep as string, not parseInt
      const date = new Date(dateParam);

      const activities = await this.searchActivityUseCase.activitiesByUserAndDate(idUsuario, date);

      res.status(200).json({
        success: true,
        date: date.toISOString().split('T')[0],
        data: activities.map((activity: Activity) => ({
          id: activity.id,
          kind: activity.kind,
          etag: activity.etag,
          htmlLink: activity.htmlLink,
          summary: activity.summary,
          creator: activity.creator,
          organizer: activity.organizer,
          start: activity.start,
          end: activity.end,
          created: activity.created,
          updated: activity.updated,
          iCalUID: activity.iCalUID,
          sequence: activity.sequence,
          transparency: activity.transparency,
          eventType: activity.eventType,
          recurrence: activity.recurrence,
          status: activity.status,
          recurringEventId: activity.recurringEventId,
          originalStartTime: activity.originalStartTime,
          reminders: activity.reminders,
          etiqueta: activity.etiqueta,
          prioridad: activity.prioridad,
          description: activity.details.description,
          location: activity.details.location,
          color: activity.priority?.color,
        })),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
