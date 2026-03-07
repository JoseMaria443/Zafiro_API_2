import type { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../Application/RegisterUser.js';
import { LoginUserUseCase } from '../../Application/LoginUser.js';
import { GetUserUseCase } from '../../Application/GetUser.js';
import { UpdateUserUseCase } from '../../Application/UpdateUser.js';
import { DeleteUserUseCase } from '../../Application/DeleteUser.js';
import { User } from '../../Domain/User.js';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase
  ) {}

  /**
   * Registro con Clerk (actualmente no se usa, crear usuarios en Clerk primero)
   * Mantenido para compatibilidad backward
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { correo, contrasenna, nombre, clerkUserId } = req.body as {
        correo?: string;
        contrasenna?: string;
        nombre?: string;
        clerkUserId?: string;
      };

      if (!clerkUserId) {
        res.status(400).json({
          success: false,
          message: 'clerkUserId es requerido para el registro',
        });
        return;
      }

      if (!correo) {
        res.status(400).json({
          success: false,
          message: 'correo es requerido',
        });
        return;
      }

      if (!contrasenna) {
        res.status(400).json({
          success: false,
          message: 'contrasenna es requerido',
        });
        return;
      }

      if (!nombre) {
        res.status(400).json({
          success: false,
          message: 'nombre es requerido',
        });
        return;
      }

      const user = await this.registerUserUseCase.execute({
        correo,
        contrasenna,
        nombre,
        clerkUserId,
      });

      const token = (await this.loginUserUseCase.executeWithEmailPassword(user.correo, contrasenna)).token;

      res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        data: {
          id: user.id,
          correo: user.correo,
          nombre: user.nombre,
          token,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Login con Clerk token
   * Valida el token con Clerk y crea/busca el usuario
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { clerkToken } = req.body as { clerkToken?: string };

      if (!clerkToken || typeof clerkToken !== 'string') {
        res.status(400).json({
          success: false,
          message: 'clerkToken requerido en el body',
        });
        return;
      }

      const { user, token, isNewUser } = await this.loginUserUseCase.execute(clerkToken);

      res.status(200).json({
        success: true,
        message: isNewUser ? 'Usuario creado y sesión iniciada' : 'Sesión iniciada correctamente',
        data: {
          id: user.id,
          clerkUserId: user.clerkUserId,
          correo: user.correo,
          nombre: user.nombre,
          token,
          isNewUser,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Obtener perfil del usuario (por UUID)
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;

      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const user = await this.getUserUseCase.execute(idParam);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          clerkUserId: user.clerkUserId,
          correo: user.correo,
          nombre: user.nombre,
        },
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Actualizar usuario (por UUID)
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;

      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const { nombre, contrasenna } = req.body;

      const updatedUser = await this.updateUserUseCase.execute({
        id: idParam,
        nombre,
        contrasenna,
      });

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: {
          id: updatedUser.id,
          clerkUserId: updatedUser.clerkUserId,
          correo: updatedUser.correo,
          nombre: updatedUser.nombre,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Eliminar usuario (por UUID)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;

      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      await this.deleteUserUseCase.execute(idParam);

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
