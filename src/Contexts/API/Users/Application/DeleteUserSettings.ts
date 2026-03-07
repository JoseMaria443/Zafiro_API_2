import type { IUserSettingsRepository } from '../Domain/UserRepository.js';

export class DeleteUserSettingsUseCase {
  constructor(private userSettingsRepository: IUserSettingsRepository) {}

  async execute(idUsuario: string): Promise<void> {
    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    await this.userSettingsRepository.delete(idUsuario);
  }
}
