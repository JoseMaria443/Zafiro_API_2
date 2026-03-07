import type { Request, Response } from 'express';
import { CreateActivityUseCase } from '../../Application/CreateActivity.js';
import { SearchUserActivitiesUseCase } from '../../Application/SearchUserActivities.js';
import type { CreateActivityRequest } from '../../Application/CreateActivity.js';
import type { EventActor, EventDateTime, EventReminders } from '../../Domain/Activity.js';
import { Activity } from '../../Domain/Activity.js';

export class ActivityPostController {
  constructor(
    private createActivityUseCase: CreateActivityUseCase,
    private searchActivityUseCase: SearchUserActivitiesUseCase
  ) {}

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

      // Ensure id and idUsuario are strings
      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de actividad inválido',
        });
        return;
      }

      if (!idUsuario || typeof idUsuario !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const request: CreateActivityRequest = {
        id,
        idUsuario,
        kind,
        etag,
        htmlLink,
        summary,
        creator: bodyParams.creator as EventActor,
        organizer: bodyParams.organizer as EventActor,
        start: bodyParams.start as EventDateTime,
        end: bodyParams.end as EventDateTime,
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
        reminders: bodyParams.reminders as EventReminders,
        etiqueta: bodyParams.etiqueta,
        priorityId: 1,
        prioridad: bodyParams.prioridad,
        prioridadNivel: bodyParams.prioridadNivel,
        color: bodyParams.color,
        repetitionId: 1,
        idFrecuencia: bodyParams.idFrecuencia,
        diasSemana: bodyParams.diasSemana,
        // RF-03 Fields
        horaInicio: bodyParams.horaInicio,
        horaFin: bodyParams.horaFin,
        tiempoDescansoMin: bodyParams.tiempoDescansoMin,
        tiempoMuertoMin: bodyParams.tiempoMuertoMin,
        source: bodyParams.source,
        googleEventId: bodyParams.googleEventId,
        frecuencia: bodyParams.frecuencia,
        prioridadValor: bodyParams.prioridadValor,
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
