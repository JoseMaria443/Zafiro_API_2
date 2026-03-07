import { UserSettings } from '../Domain/UserSettings.js';
import type { IUserSettingsRepository } from '../Domain/UserRepository.js';

export interface CreateUserSettingsRequest {
  idUsuario: string; // UUID (formerly number)
  ocupacion?: string;
  horaInicio?: number;
  horaFin?: number;
}

export class CreateUserSettingsUseCase {
  constructor(private userSettingsRepository: IUserSettingsRepository) {}

  async execute(request: CreateUserSettingsRequest): Promise<UserSettings> {
    if (!request.idUsuario || request.idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    const id = crypto.randomUUID();

    if (request.horaInicio !== undefined && request.horaFin !== undefined) {
      if (request.horaInicio >= request.horaFin) {
        throw new Error('La hora de inicio debe ser anterior a la hora de fin');
      }
    }

    const userSettings = new UserSettings(
      id,
      request.idUsuario,
      request.ocupacion,
      request.horaInicio,
      request.horaFin
    );

    await this.userSettingsRepository.save(userSettings);

    return userSettings;
  }
}
