import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { PasswordHasher } from '../../../../Shared/Infrastructure/Security/PasswordHasher.js';

export interface RegisterUserRequest {
  correo: string;
  contrasenna: string;
  nombre: string;
  clerkUserId: string;
}

export class RegisterUserUseCase {
  private passwordHasher = new PasswordHasher();

  constructor(private userRepository: IUserRepository) {}

  async execute(request: RegisterUserRequest): Promise<User> {
    const exists = await this.userRepository.exists(request.correo);

    if (exists) {
      throw new Error('El correo ya está registrado');
    }

    // Validar contraseña
    if (request.contrasenna.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    if (!request.clerkUserId || request.clerkUserId.trim().length === 0) {
      throw new Error('Clerk User ID es requerido');
    }

    // Cifrar contraseña
    const hashedPassword = await this.passwordHasher.hash(request.contrasenna);

    return await this.userRepository.findOrCreateByClerkProfile(
      request.clerkUserId,
      request.correo,
      request.nombre,
      hashedPassword
    );
  }
}

