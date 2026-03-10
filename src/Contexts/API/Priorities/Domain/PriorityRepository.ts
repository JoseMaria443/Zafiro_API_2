import { Priority } from './Priority.js';

export interface IPriorityRepository {
  save(priority: Priority): Promise<void>;
  findById(id: string): Promise<Priority | null>;
  findByActivityId(idActividad: string): Promise<Priority | null>;
  findByUserId(idUsuario: string): Promise<Priority[]>;
  update(priority: Priority): Promise<void>;
  delete(id: string): Promise<void>;
}
