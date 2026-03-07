import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { JwtTokenGenerator } from '../../../Shared/Infrastructure/Security/JwtTokenGenerator.js';
import { ClerkService } from '../../../../Shared/Infrastructure/Security/ClerkService.js';
import { randomUUID } from 'crypto';

export interface LoginResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

export class LoginUserUseCase {
  private jwtGenerator = new JwtTokenGenerator();
  private clerkService = new ClerkService();

  constructor(private userRepository: IUserRepository) {}

  /**
   * Login con Clerk token
   * Si el usuario no existe, lo crea automáticamente
   */
  async execute(clerkToken: string): Promise<LoginResponse> {
    if (!clerkToken || clerkToken.trim().length === 0) {
      throw new Error('Token de Clerk requerido');
    }

    // Validar token de Clerk y obtener información del usuario
    const clerkUserInfo = await this.clerkService.validateToken(clerkToken);

    // Buscar usuario existente por clerk_user_id
    let user = await this.userRepository.findByClerkUserId(clerkUserInfo.clerkUserId);
    let isNewUser = false;

    if (!user) {
      // Usuario no existe, crear uno nuevo
      isNewUser = true;
      const userId = randomUUID();
      
      // Crear contraseña temporal (no será usada con Clerk, pero requerida por el modelo)
      const tempPassword = randomUUID();
      
      user = new User(
        userId,
        clerkUserInfo.clerkUserId,
        clerkUserInfo.correo,
        tempPassword,
        clerkUserInfo.nombre
      );

      await this.userRepository.save(user);
    }

    // Generar JWT del API (para operaciones internas del API)
    const token = this.jwtGenerator.generateToken({
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
      clerkUserId: user.clerkUserId,
    });

    return { user, token, isNewUser };
  }

  /**
   * Login legado con correo/contraseña (mantenido para backward compatibility)
   */
  async executeWithEmailPassword(
    correo: string,
    contrasenna: string
  ): Promise<LoginResponse> {
    if (!correo || correo.trim().length === 0) {
      throw new Error('El correo es requerido');
    }

    if (!contrasenna || contrasenna.length === 0) {
      throw new Error('La contraseña es requerida');
    }

    const user = await this.userRepository.findByEmail(correo);

    if (!user) {
      throw new Error('Correo o contraseña inválidos');
    }

    // Generar JWT
    const token = this.jwtGenerator.generateToken({
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
      clerkUserId: user.clerkUserId,
    });

    return { user, token, isNewUser: false };
  }
}

