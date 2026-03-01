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
      } = req.body;

      const request: CreateActivityRequest = {
        id,
        idUsuario,
        kind,
        etag,
        htmlLink,
        summary,
        creator: creator as EventActor,
        organizer: organizer as EventActor,
        start: start as EventDateTime,
        end: end as EventDateTime,
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
        originalStartTime: originalStartTime as EventDateTime,
        reminders: reminders as EventReminders,
        etiqueta,
        priorityId,
        prioridad,
        prioridadNivel,
        color,
        repetitionId,
        idFrecuencia,
        diasSemana,
      };

      if (fechaInicio) {
        request.fechaInicio = new Date(fechaInicio);
      }

      if (fechaFin) {
        request.fechaFin = new Date(fechaFin);
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

      const idUsuario = parseInt(userIdParam);

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

      const idUsuario = parseInt(userIdParam);
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
