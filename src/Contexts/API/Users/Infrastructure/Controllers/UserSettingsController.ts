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
      const { idUsuario, ocupacion, horaInicio, horaFin } = req.body;

      const userSettings = await this.createUserSettingsUseCase.execute({
        idUsuario: parseInt(idUsuario, 10),
        ocupacion,
        horaInicio,
        horaFin,
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
      const userIdParam = req.params.userId;

      if (!userIdParam || typeof userIdParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const idUsuario = parseInt(userIdParam, 10);
      if (isNaN(idUsuario)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario debe ser un número',
        });
        return;
      }

      const userSettings = await this.searchUserSettingsUseCase.execute(idUsuario);

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
      const userIdParam = req.params.userId;

      if (!userIdParam || typeof userIdParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const idUsuario = parseInt(userIdParam, 10);
      if (isNaN(idUsuario)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario debe ser un número',
        });
        return;
      }

      const { ocupacion, horaInicio, horaFin } = req.body;

      const userSettings = await this.updateUserSettingsUseCase.execute({
        idUsuario,
        ocupacion,
        horaInicio,
        horaFin,
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
      const userIdParam = req.params.userId;

      if (!userIdParam || typeof userIdParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const idUsuario = parseInt(userIdParam, 10);
      if (isNaN(idUsuario)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario debe ser un número',
        });
        return;
      }

      await this.deleteUserSettingsUseCase.execute(idUsuario);

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
