import type { IUserSettingsRepository } from '../Domain/UserRepository.js';

export class DeleteUserSettingsUseCase {
  constructor(private userSettingsRepository: IUserSettingsRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de configuración inválido');
    }

    await this.userSettingsRepository.delete(id);
  }
}
