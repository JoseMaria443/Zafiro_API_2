import { UserSettings } from '../Domain/UserSettings.js';
import type { IUserSettingsRepository } from '../Domain/UserRepository.js';
import type { CreateUserSettingsRequest } from './CreateUserSettings.js';

export class UpdateUserSettingsUseCase {
  constructor(private userSettingsRepository: IUserSettingsRepository) {}

  async execute(request: CreateUserSettingsRequest): Promise<UserSettings> {
    if (!request.idUsuario || request.idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    // Obtener la configuración actual
    const currentSettings = await this.userSettingsRepository.findByUserId(request.idUsuario);
    
    if (!currentSettings) {
      throw new Error('Configuración de usuario no encontrada');
    }

    const updatedSettings = new UserSettings(
      currentSettings.id,
      request.idUsuario,
      request.ocupacion ?? currentSettings.ocupacion,
      request.hora_inicio ?? currentSettings.hora_inicio,
      request.hora_fin ?? currentSettings.hora_fin
    );

    await this.userSettingsRepository.update(updatedSettings);

    return updatedSettings;
  }
}
