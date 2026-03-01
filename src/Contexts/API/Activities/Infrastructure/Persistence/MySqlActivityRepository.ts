import { Activity } from '../../Domain/Activity.js';
import type { IActivityRepository } from '../../Domain/ActivityRepository.js';

export class MySqlActivityRepository implements IActivityRepository {
  private activities: Activity[] = [];

  async save(activity: Activity): Promise<void> {
    const existingIndex = this.activities.findIndex((item) => item.id === activity.id);
    if (existingIndex >= 0) {
      this.activities[existingIndex] = activity;
      return;
    }
    this.activities.push(activity);
  }

  async findById(id: string): Promise<Activity | null> {
    return this.activities.find((activity) => activity.id === id) ?? null;
  }

  async findByUserId(idUsuario: number): Promise<Activity[]> {
    return this.activities.filter((activity) => activity.idUsuario === idUsuario);
  }

  async findByUserIdAndDate(idUsuario: number, date: Date): Promise<Activity[]> {
    const targetDate = date.toISOString().split('T')[0];

    return this.activities.filter((activity) => {
      if (activity.idUsuario !== idUsuario) {
        return false;
      }

      const startDateTime = activity.start.dateTime ?? activity.start.date;
      if (!startDateTime) {
        return false;
      }

      return startDateTime.slice(0, 10) === targetDate;
    });
  }

  async findByTagId(idEtiqueta: number): Promise<Activity[]> {
    return this.activities.filter((activity) => activity.idEtiqueta === idEtiqueta);
  }

  async update(activity: Activity): Promise<void> {
    const existingIndex = this.activities.findIndex((item) => item.id === activity.id);
    if (existingIndex < 0) {
      throw new Error(`Actividad con ID ${activity.id} no encontrada`);
    }
    this.activities[existingIndex] = activity;
  }

  async delete(id: string): Promise<void> {
    this.activities = this.activities.filter((activity) => activity.id !== id);
  }
}
