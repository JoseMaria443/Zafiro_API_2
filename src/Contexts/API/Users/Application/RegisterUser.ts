import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';

export interface RegisterUserRequest {
  correo: string;
  nombre: string;
  clerkUserId: string;
}

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: RegisterUserRequest): Promise<User> {
    const exists = await this.userRepository.exists(request.correo);

    if (exists) {
      throw new Error('El correo ya está registrado');
    }

    if (!request.clerkUserId || request.clerkUserId.trim().length === 0) {
      throw new Error('Clerk User ID es requerido');
    }

    return await this.userRepository.findOrCreateByClerkProfile(
      request.clerkUserId,
      request.correo,
      request.nombre
    );
  }
}

