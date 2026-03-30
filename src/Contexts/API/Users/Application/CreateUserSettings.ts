import { UserSettings } from '../Domain/UserSettings.js';
import type { IUserSettingsRepository } from '../Domain/UserRepository.js';

export interface CreateUserSettingsRequest {
  idUsuario: string; // UUID (formerly number)
  ocupacion?: string;
  hora_inicio?: string;
  hora_fin?: string;
}

export class CreateUserSettingsUseCase {
  constructor(private userSettingsRepository: IUserSettingsRepository) {}

  async execute(request: CreateUserSettingsRequest): Promise<UserSettings> {
    if (!request.idUsuario || request.idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    const id = crypto.randomUUID();



    const userSettings = new UserSettings(
      id,
      request.idUsuario,
      request.ocupacion,
      request.hora_inicio,
      request.hora_fin
    );

    await this.userSettingsRepository.save(userSettings);

    return userSettings;
  }
}
