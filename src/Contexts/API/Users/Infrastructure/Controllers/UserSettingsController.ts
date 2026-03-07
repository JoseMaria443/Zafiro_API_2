import type { Request, Response } from 'express';
import { CreateUserSettingsUseCase } from '../../Application/CreateUserSettings.js';
import { SearchUserSettingsUseCase } from '../../Application/SearchUserSettings.js';
import { UpdateUserSettingsUseCase } from '../../Application/UpdateUserSettings.js';
import { DeleteUserSettingsUseCase } from '../../Application/DeleteUserSettings.js';

export class UserSettingsController {
  constructor(
    private createUserSettingsUseCase: CreateUserSettingsUseCase,
    private searchUserSettingsUseCase: SearchUserSettingsUseCase,
    private updateUserSettingsUseCase: UpdateUserSettingsUseCase,
    private deleteUserSettingsUseCase: DeleteUserSettingsUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { idUsuario, ocupacion } = req.body;

      // Reject if trying to set hora_inicio or hora_fin
      if (req.body.horaInicio !== undefined || req.body.horaFin !== undefined) {
        res.status(400).json({
          success: false,
          message: 'No se pueden editar hora_inicio y hora_fin. Estos son campos de solo lectura (sistema).',
        });
        return;
      }

      if (!idUsuario || typeof idUsuario !== 'string' || idUsuario.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const userSettings = await this.createUserSettingsUseCase.execute({
        idUsuario,
        ocupacion,
      });

      res.status(201).json({
        success: true,
        message: 'Ajustes de usuario creados correctamente',
        data: {
          id: userSettings.id,
          idUsuario: userSettings.idUsuario,
          ocupacion: userSettings.ocupacion,
          horaInicio: userSettings.horaInicio,
          horaFin: userSettings.horaFin,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getByUserId(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.userId as string;

      if (!userIdParam || userIdParam.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const userSettings = await this.searchUserSettingsUseCase.execute(userIdParam);

      if (!userSettings) {
        res.status(404).json({
          success: false,
          message: 'Ajustes no encontrados',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: userSettings.id,
          idUsuario: userSettings.idUsuario,
          ocupacion: userSettings.ocupacion,
          horaInicio: userSettings.horaInicio,
          horaFin: userSettings.horaFin,
        },
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Ajustes no encontrados',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.userId as string;

      if (!userIdParam || userIdParam.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      // Reject if trying to edit hora_inicio or hora_fin
      if (req.body.horaInicio !== undefined || req.body.horaFin !== undefined) {
        res.status(400).json({
          success: false,
          message: 'No se pueden editar hora_inicio y hora_fin. Estos son campos de solo lectura (sistema).',
        });
        return;
      }

      const { ocupacion } = req.body;

      const userSettings = await this.updateUserSettingsUseCase.execute({
        idUsuario: userIdParam,
        ocupacion,
      });

      res.status(200).json({
        success: true,
        message: 'Ajustes de usuario actualizados correctamente',
        data: {
          id: userSettings.id,
          idUsuario: userSettings.idUsuario,
          ocupacion: userSettings.ocupacion,
          horaInicio: userSettings.horaInicio,
          horaFin: userSettings.horaFin,
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
      const userIdParam = req.params.userId as string;

      if (!userIdParam || userIdParam.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      await this.deleteUserSettingsUseCase.execute(userIdParam);

      res.status(200).json({
        success: true,
        message: 'Ajustes de usuario eliminados correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
