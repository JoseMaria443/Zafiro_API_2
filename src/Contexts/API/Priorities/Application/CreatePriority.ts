import { Priority, PriorityValue } from '../Domain/Priority.js';
import type { IPriorityRepository } from '../Domain/PriorityRepository.js';
import { randomUUID } from 'crypto';

export interface CreatePriorityRequest {
  id?: string;
  idActividad: string;
  valor: PriorityValue;
  color: string;
}

export class CreatePriorityUseCase {
  constructor(private priorityRepository: IPriorityRepository) {}

  async execute(request: CreatePriorityRequest): Promise<Priority> {
    // Verificar que no exista ya una prioridad para esta actividad
    const existingPriority = await this.priorityRepository.findByActivityId(
      request.idActividad
    );

    if (existingPriority) {
      throw new Error('Ya existe una prioridad para esta actividad');
    }

    const priorityId = request.id || randomUUID();

    const priority = new Priority(
      priorityId,
      request.idActividad,
      request.valor,
      request.color
    );

    await this.priorityRepository.save(priority);

    return priority;
  }
}
