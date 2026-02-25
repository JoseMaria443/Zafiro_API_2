import { Activity } from '../Domain/Activity.js';
import type { IActivityRepository } from '../Domain/ActivityRepository.js';

export class SearchUserActivitiesUseCase {
  constructor(private activityRepository: IActivityRepository) {}

  async allActivitiesByUser(idUsuario: number): Promise<Activity[]> {
    if (idUsuario < 1) {
      throw new Error('ID de usuario inválido');
    }

    return await this.activityRepository.findByUserId(idUsuario);
  }

  async activitiesByUserAndDate(
    idUsuario: number,
    date: Date
  ): Promise<Activity[]> {
    if (idUsuario < 1) {
      throw new Error('ID de usuario inválido');
    }

    if (isNaN(date.getTime())) {
      throw new Error('Fecha inválida');
    }

    return await this.activityRepository.findByUserIdAndDate(idUsuario, date);
  }

  async activitiesByTag(idEtiqueta: number): Promise<Activity[]> {
    if (idEtiqueta < 1) {
      throw new Error('ID de etiqueta inválido');
    }

    return await this.activityRepository.findByTagId(idEtiqueta);
  }

  async activityById(id: string): Promise<Activity | null> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de actividad inválido');
    }

    return await this.activityRepository.findById(id);
  }
}
