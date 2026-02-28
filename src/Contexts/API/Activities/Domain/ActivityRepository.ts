import { Activity } from './Activity.js';

export interface IActivityRepository {

  save(activity: Activity): Promise<void>;

  findById(id: number): Promise<Activity | null>;

  findByUserId(idUsuario: number): Promise<Activity[]>;

  findByUserIdAndDate(idUsuario: number, date: Date): Promise<Activity[]>;

  findByTagId(idEtiqueta: number): Promise<Activity[]>;

  update(activity: Activity): Promise<void>;

  delete(id: number): Promise<void>;
}
