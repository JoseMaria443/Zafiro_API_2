import { UserSettings } from '../Domain/UserSettings.js';
import type { IUserSettingsRepository } from '../Domain/UserRepository.js';

export interface UpdateUserSettingsRequest {
  idUsuario: string; // UUID (formerly number)
  ocupacion?: string;
  horaInicio?: string;
  horaFin?: string;
}

export class UpdateUserSettingsUseCase {
  constructor(private userSettingsRepository: IUserSettingsRepository) {}

  async execute(request: UpdateUserSettingsRequest): Promise<UserSettings> {
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
      request.horaInicio ?? currentSettings.horaInicio,
      request.horaFin ?? currentSettings.horaFin
    );

    await this.userSettingsRepository.update(updatedSettings);

    return updatedSettings;
  }
}
