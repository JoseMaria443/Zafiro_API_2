import { Priority } from '../Domain/Priority.js';
import type { IPriorityRepository } from '../Domain/PriorityRepository.js';

export class SearchPrioritiesUseCase {
  constructor(private priorityRepository: IPriorityRepository) {}

  async priorityById(id: string): Promise<Priority | null> {
    return await this.priorityRepository.findById(id);
  }

  async priorityByActivityId(idActividad: string): Promise<Priority | null> {
    return await this.priorityRepository.findByActivityId(idActividad);
  }

  async allPrioritiesByUser(idUsuario: string): Promise<Priority[]> {
    return await this.priorityRepository.findByUserId(idUsuario);
  }
}
