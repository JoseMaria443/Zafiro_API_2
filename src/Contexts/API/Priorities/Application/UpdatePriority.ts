import { Priority, PriorityValue } from '../Domain/Priority.js';
import type { IPriorityRepository } from '../Domain/PriorityRepository.js';

export interface UpdatePriorityRequest {
  id: string;
  valor?: PriorityValue;
  color?: string;
}

export class UpdatePriorityUseCase {
  constructor(private priorityRepository: IPriorityRepository) {}

  async execute(request: UpdatePriorityRequest): Promise<Priority> {
    const existingPriority = await this.priorityRepository.findById(request.id);

    if (!existingPriority) {
      throw new Error('Prioridad no encontrada');
    }

    const updatedPriority = new Priority(
      existingPriority.id,
      existingPriority.idActividad,
      request.valor ?? existingPriority.valor,
      request.color ?? existingPriority.color
    );

    await this.priorityRepository.update(updatedPriority);

    return updatedPriority;
  }
}
