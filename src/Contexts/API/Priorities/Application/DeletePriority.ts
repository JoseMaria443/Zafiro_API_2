import type { IPriorityRepository } from '../Domain/PriorityRepository.js';

export class DeletePriorityUseCase {
  constructor(private priorityRepository: IPriorityRepository) {}

  async execute(id: string): Promise<void> {
    const existingPriority = await this.priorityRepository.findById(id);

    if (!existingPriority) {
      throw new Error('Prioridad no encontrada');
    }

    await this.priorityRepository.delete(id);
  }
}
