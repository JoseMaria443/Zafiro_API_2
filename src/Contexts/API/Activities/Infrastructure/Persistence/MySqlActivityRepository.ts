import { Activity } from '../../Domain/Activity.js';
import type { IActivityRepository } from '../../Domain/ActivityRepository.js';

export class MySqlActivityRepository implements IActivityRepository {
  async save(activity: Activity): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findById(id: string): Promise<Activity | null> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findByUserId(idUsuario: number): Promise<Activity[]> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findByUserIdAndDate(idUsuario: number, date: Date): Promise<Activity[]> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findByTagId(idEtiqueta: number): Promise<Activity[]> {
    throw new Error('Implementar con conexión MySQL');
  }

  async update(activity: Activity): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }
}
