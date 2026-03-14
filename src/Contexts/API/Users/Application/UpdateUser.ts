import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';

export interface UpdateUserRequest {
  id: string; // UUID (formerly number)
  nombre?: string;
  tokenGoogle?: string;
}

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: UpdateUserRequest): Promise<User> {
    if (!request.id || request.id.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    const user = await this.userRepository.findById(request.id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const updatedUser = new User(
      user.id,
      user.clerkUserId,
      user.correo,
      request.nombre || user.nombre,
      request.tokenGoogle || user.tokenGoogle
    );

    await this.userRepository.update(updatedUser);

    return updatedUser;
  }
}
