import type { Request, Response } from 'express';
import { CreateActivityUseCase } from '../../Application/CreateActivity.js';
import { SearchUserActivitiesUseCase } from '../../Application/SearchUserActivities.js';
import type { CreateActivityRequest } from '../../Application/CreateActivity.js';
import type { EventDateTime } from '../../Domain/Activity.js';
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
        summary,
        start,
        end,
        created,
        updated,
        status,
        detailsId,
        description,
        location,
        idEtiqueta,
        recurringEventId,
        priorityId,
        prioridad,
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
        summary,
        start: start as EventDateTime,
        end: end as EventDateTime,
        created,
        updated,
        status,
        detailsId,
        description,
        location,
        idEtiqueta,
        recurringEventId,
        priorityId,
        prioridad,
        color,
        repetitionId,
        idFrecuencia,
        diasSemana,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      };

      const activity = await this.createActivityUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Actividad creada correctamente',
        data: {
          id: activity.id,
          idUsuario: activity.idUsuario,
          idEtiqueta: activity.idEtiqueta,
          summary: activity.summary,
          start: activity.start,
          end: activity.end,
          created: activity.created,
          updated: activity.updated,
          status: activity.status,
          recurringEventId: activity.recurringEventId,
          description: activity.details.description,
          location: activity.details.location,
          prioridad: activity.priority?.valor,
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
          idUsuario: activity.idUsuario,
          idEtiqueta: activity.idEtiqueta,
          summary: activity.summary,
          start: activity.start,
          end: activity.end,
          created: activity.created,
          updated: activity.updated,
          status: activity.status,
          recurringEventId: activity.recurringEventId,
          description: activity.details.description,
          location: activity.details.location,
          prioridad: activity.priority?.valor,
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
          summary: activity.summary,
          start: activity.start,
          end: activity.end,
          status: activity.status,
          recurringEventId: activity.recurringEventId,
          description: activity.details.description,
          location: activity.details.location,
          prioridad: activity.priority?.valor,
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
