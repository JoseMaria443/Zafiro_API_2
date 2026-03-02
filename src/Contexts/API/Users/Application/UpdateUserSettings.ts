import { UserSettings } from '../Domain/UserSettings.js';
import type { IUserSettingsRepository } from '../Domain/UserRepository.js';

export interface UpdateUserSettingsRequest {
  id: string;
  ocupacion?: string;
  horaInicio?: number;
  horaFin?: number;
}

export class UpdateUserSettingsUseCase {
  constructor(private userSettingsRepository: IUserSettingsRepository) {}

  async execute(request: UpdateUserSettingsRequest): Promise<UserSettings> {
    if (!request.id || request.id.trim().length === 0) {
      throw new Error('ID de configuración inválido');
    }

    if (request.horaInicio !== undefined && request.horaFin !== undefined) {
      if (request.horaInicio >= request.horaFin) {
        throw new Error('La hora de inicio debe ser anterior a la hora de fin');
      }
    }

    const updatedSettings = new UserSettings(
      request.id,
      '', // idUsuario no cambia, pero lo necesitamos
      request.ocupacion,
      request.horaInicio,
      request.horaFin
    );

    await this.userSettingsRepository.update(updatedSettings);

    return updatedSettings;
  }
}
