import { UserSettings } from '../Domain/UserSettings.js';
import type { IUserSettingsRepository } from '../Domain/UserRepository.js';

export class SearchUserSettingsUseCase {
  constructor(private userSettingsRepository: IUserSettingsRepository) {}

  async findByUserId(idUsuario: string): Promise<UserSettings | null> {
    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    return await this.userSettingsRepository.findByUserId(idUsuario);
  }
}
