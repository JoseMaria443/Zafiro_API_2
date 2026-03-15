import type { Request, Response } from 'express';
import { CreateUserSettingsUseCase } from '../../Application/CreateUserSettings.js';
import { SearchUserSettingsUseCase } from '../../Application/SearchUserSettings.js';
import { UpdateUserSettingsUseCase } from '../../Application/UpdateUserSettings.js';
import { DeleteUserSettingsUseCase } from '../../Application/DeleteUserSettings.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';

export class UserSettingsController {
  private db = PostgresConnection.getInstance();

  constructor(
    private createUserSettingsUseCase: CreateUserSettingsUseCase,
    private searchUserSettingsUseCase: SearchUserSettingsUseCase,
    private updateUserSettingsUseCase: UpdateUserSettingsUseCase,
    private deleteUserSettingsUseCase: DeleteUserSettingsUseCase
  ) {}

  private async resolveUserId(req: Request): Promise<string | null> {
    const authUser = (req as any).user as
      | { clerkUserId?: string }
      | undefined;

    if (!authUser?.clerkUserId) {
      return null;
    }

    const result = await this.db.query(
      'SELECT id FROM usuarios WHERE clerk_user_id = $1',
      [authUser.clerkUserId]
    );

    return result.rows[0]?.id ?? null;
  }

  private validateOwnership(
    resolvedUserId: string,
    paramUserId: string,
    res: Response
  ): boolean {
    if (paramUserId !== resolvedUserId) {
      res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a los ajustes de otro usuario',
      });
      return false;
    }
    return true;
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      // Bloquear idUsuario en el body, se resuelve desde el token
      if (typeof (req.body as any).idUsuario !== 'undefined') {
        res.status(400).json({
          success: false,
          message: 'No se permite enviar idUsuario en el body. Se resuelve desde el token.',
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

      // Verificar que :userId de la URL corresponde al token
      const userIdParam = req.params.userId as string;
      if (!this.validateOwnership(resolvedUserId, userIdParam, res)) {
        return;
      }

      const { ocupacion, horaInicio, horaFin } = req.body as {
        ocupacion?: string;
        horaInicio?: number;
        horaFin?: number;
      };

      const userSettings = await this.createUserSettingsUseCase.execute({
        idUsuario: resolvedUserId,
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
      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const userIdParam = req.params.userId as string;
      if (!this.validateOwnership(resolvedUserId, userIdParam, res)) {
        return;
      }

      const userSettings = await this.searchUserSettingsUseCase.execute(resolvedUserId);

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
      // Bloquear idUsuario en el body, se resuelve desde el token
      if (typeof (req.body as any).idUsuario !== 'undefined') {
        res.status(400).json({
          success: false,
          message: 'No se permite enviar idUsuario en el body. Se resuelve desde el token.',
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

      const userIdParam = req.params.userId as string;
      if (!this.validateOwnership(resolvedUserId, userIdParam, res)) {
        return;
      }

      const { ocupacion, horaInicio, horaFin } = req.body as {
        ocupacion?: string;
        horaInicio?: number;
        horaFin?: number;
      };

      const userSettings = await this.updateUserSettingsUseCase.execute({
        idUsuario: resolvedUserId,
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
      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const userIdParam = req.params.userId as string;
      if (!this.validateOwnership(resolvedUserId, userIdParam, res)) {
        return;
      }

      await this.deleteUserSettingsUseCase.execute(resolvedUserId);

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