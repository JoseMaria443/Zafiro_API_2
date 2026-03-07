import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';

export class GetUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<User> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }
}
