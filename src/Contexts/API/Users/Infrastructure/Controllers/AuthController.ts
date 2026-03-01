import type { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../Application/RegisterUser.js';
import { LoginUserUseCase } from '../../Application/LoginUser.js';
import { GetUserUseCase } from '../../Application/GetUser.js';
import { UpdateUserUseCase } from '../../Application/UpdateUser.js';
import { DeleteUserUseCase } from '../../Application/DeleteUser.js';
import { User } from '../../Domain/User.js';
import { JwtTokenGenerator } from '../../../../Shared/Infrastructure/Security/JwtTokenGenerator.js';

export class AuthController {
  private jwtGenerator = new JwtTokenGenerator();

  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { correo, contrasenna, nombre } = req.body;

      const user = await this.registerUserUseCase.execute({
        correo,
        contrasenna,
        nombre,
      });

      // Generar token para el nuevo usuario
      const token = this.jwtGenerator.generateToken({
        id: user.id,
        correo: user.correo,
        nombre: user.nombre,
      });

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

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { correo, contrasenna } = req.body;

      const { user, token } = await this.loginUserUseCase.execute(correo, contrasenna);

      res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente',
        data: {
          id: user.id,
          correo: user.correo,
          nombre: user.nombre,
          token,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const id = parseInt(idParam);
      const user = await this.getUserUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
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

  async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const id = parseInt(idParam);
      const { nombre, contrasenna } = req.body;

      const updatedUser = await this.updateUserUseCase.execute({
        id,
        nombre,
        contrasenna,
      });

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: {
          id: updatedUser.id,
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

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const id = parseInt(idParam);
      await this.deleteUserUseCase.execute(id);

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
