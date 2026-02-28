import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';

export interface UpdateUserRequest {
  id: number;
  nombre?: string;
  password?: string;
  tokenGoogle?: string;
}

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: UpdateUserRequest): Promise<User> {
    const user = await this.userRepository.findById(request.id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const updatedUser = new User(
      user.id,
      user.correo,
      request.password || user.password,
      request.nombre || user.nombre,
      request.tokenGoogle || user.tokenGoogle
    );

    await this.userRepository.update(updatedUser);

    return updatedUser;
  }
}
