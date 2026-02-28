import type { Request, Response } from 'express';
import { CreateActivityUseCase } from '../../Application/CreateActivity.js';
import { SearchUserActivitiesUseCase } from '../../Application/SearchUserActivities.js';
import type { CreateActivityRequest } from '../../Application/CreateActivity.js';
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
        idClerk,
        idUsuario,
        idEtiqueta,
        fechaCreacion,
        detailsId,
        title,
        descripcion,
        Ubicacion,
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
        idClerk,
        idUsuario,
        idEtiqueta,
        fechaCreacion,
        detailsId,
        title,
        descripcion,
        Ubicacion,
        priorityId,
        prioridad,
        color,
        repetitionId,
        idFrecuencia,
        diasSemana,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
      };

      const activity = await this.createActivityUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Actividad creada correctamente',
        data: {
          id: activity.id,
          idClerk: activity.idClerk,
          idUsuario: activity.idUsuario,
          idEtiqueta: activity.idEtiqueta,
          fechaCreacion: activity.fechaCreacion,
          title: activity.details.title,
          descripcion: activity.details.descripcion,
          Ubicacion: activity.details.Ubicacion,
          prioridad: activity.priority.valor,
          color: activity.priority.color,
          diasSemana: activity.repetition.diasSemana,
          fechaInicio: activity.repetition.fechaInicio,
          fechaFin: activity.repetition.fechaFin,
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
          idClerk: activity.idClerk,
          idUsuario: activity.idUsuario,
          idEtiqueta: activity.idEtiqueta,
          fechaCreacion: activity.fechaCreacion,
          title: activity.details.title,
          descripcion: activity.details.descripcion,
          Ubicacion: activity.details.Ubicacion,
          prioridad: activity.priority.valor,
          color: activity.priority.color,
          diasSemana: activity.repetition.diasSemana,
          fechaInicio: activity.repetition.fechaInicio,
          fechaFin: activity.repetition.fechaFin,
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
          Ubicacion: activity.details.Ubicacion,
          prioridad: activity.priority.valor,
          color: activity.priority.coloracion,
          prioridad: activity.priority.valor,
          color: activity.priority.colores,
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
