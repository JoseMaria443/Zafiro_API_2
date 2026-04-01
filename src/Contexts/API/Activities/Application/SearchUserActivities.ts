import { Activity } from '../Domain/Activity.js';
import type { IActivityRepository } from '../Domain/ActivityRepository.js';

export class SearchUserActivitiesUseCase {
  constructor(private activityRepository: IActivityRepository) {}

  async allActivitiesByUser(idUsuario: string): Promise<Activity[]> {
    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    return await this.activityRepository.findByUserId(idUsuario);
  }

  async activitiesByUserAndDate(
    idUsuario: string,
    date: Date
  ): Promise<Activity[]> {
    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    if (isNaN(date.getTime())) {
      throw new Error('Fecha inválida');
    }

    return await this.activityRepository.findByUserIdAndDate(idUsuario, date);
  }

  async activitiesByUserAndDateRange(
    idUsuario: string,
    from: Date,
    to: Date
  ): Promise<Activity[]> {
    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error('Fechas inválidas');
    }

    if (from.getTime() > to.getTime()) {
      throw new Error('from no puede ser mayor a to');
    }

    return await this.activityRepository.findByUserIdInRange(idUsuario, from, to);
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
