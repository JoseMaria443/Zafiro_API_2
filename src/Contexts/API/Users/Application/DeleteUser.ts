import type { IUserRepository } from '../Domain/UserRepository.js';

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await this.userRepository.delete(id);
  }
}
