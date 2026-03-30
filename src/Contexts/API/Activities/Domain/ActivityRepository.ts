import { Activity } from './Activity.js';

export interface IActivityRepository {

  save(activity: Activity): Promise<void>;

  findById(id: string): Promise<Activity | null>;

  findByGoogleEventId(googleEventId: string): Promise<Activity | null>;

  findByGoogleEventIds(googleEventIds: string[]): Promise<Map<string, Activity>>;

  findByUserId(idUsuario: string): Promise<Activity[]>; // UUID (formerly number)

  findByUserIdAndDate(idUsuario: string, date: Date): Promise<Activity[]>; // UUID (formerly number)

  findByTagId(idEtiqueta: number): Promise<Activity[]>;

  update(activity: Activity): Promise<void>;

  delete(id: string): Promise<void>;
}
