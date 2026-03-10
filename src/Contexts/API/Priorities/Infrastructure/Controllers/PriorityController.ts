import type { Request, Response } from 'express';
import { CreatePriorityUseCase } from '../../Application/CreatePriority.js';
import { SearchPrioritiesUseCase } from '../../Application/SearchPriorities.js';
import { UpdatePriorityUseCase } from '../../Application/UpdatePriority.js';
import { DeletePriorityUseCase } from '../../Application/DeletePriority.js';
import { Priority } from '../../Domain/Priority.js';

export class PriorityController {
  constructor(
    private createPriorityUseCase: CreatePriorityUseCase,
    private searchPrioritiesUseCase: SearchPrioritiesUseCase,
    private updatePriorityUseCase: UpdatePriorityUseCase,
    private deletePriorityUseCase: DeletePriorityUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { id, idActividad, valor, color } = req.body;

      const priority = await this.createPriorityUseCase.execute({
        id,
        idActividad,
        valor,
        color,
      });

      res.status(201).json({
        success: true,
        message: 'Prioridad creada correctamente',
        data: {
          id: priority.id,
          idActividad: priority.idActividad,
          valor: priority.valor,
          color: priority.color,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getUserPriorities(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.userId;

      if (!userIdParam || typeof userIdParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const priorities = await this.searchPrioritiesUseCase.allPrioritiesByUser(userIdParam);

      res.status(200).json({
        success: true,
        data: priorities.map((priority: Priority) => ({
          id: priority.id,
          idActividad: priority.idActividad,
          valor: priority.valor,
          color: priority.color,
        })),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getPriorityById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de prioridad inválido',
        });
        return;
      }

      const priority = await this.searchPrioritiesUseCase.priorityById(idParam);

      if (!priority) {
        res.status(404).json({
          success: false,
          message: 'Prioridad no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: priority.id,
          idActividad: priority.idActividad,
          valor: priority.valor,
          color: priority.color,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getPriorityByActivityId(req: Request, res: Response): Promise<void> {
    try {
      const activityIdParam = req.params.activityId;

      if (!activityIdParam || typeof activityIdParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de actividad inválido',
        });
        return;
      }

      const priority = await this.searchPrioritiesUseCase.priorityByActivityId(activityIdParam);

      if (!priority) {
        res.status(404).json({
          success: false,
          message: 'Prioridad no encontrada para esta actividad',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: priority.id,
          idActividad: priority.idActividad,
          valor: priority.valor,
          color: priority.color,
        },
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
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de prioridad inválido',
        });
        return;
      }

      const { valor, color } = req.body;

      const updatedPriority = await this.updatePriorityUseCase.execute({
        id: idParam,
        valor,
        color,
      });

      res.status(200).json({
        success: true,
        message: 'Prioridad actualizada correctamente',
        data: {
          id: updatedPriority.id,
          idActividad: updatedPriority.idActividad,
          valor: updatedPriority.valor,
          color: updatedPriority.color,
        },
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
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de prioridad inválido',
        });
        return;
      }

      await this.deletePriorityUseCase.execute(idParam);

      res.status(200).json({
        success: true,
        message: 'Prioridad eliminada correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
