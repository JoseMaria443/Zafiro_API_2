import { Activity, EventDateTime } from '../Domain/Activity.js';
import { ActivityDetails } from '../Domain/ActivityDetails.js';
import { ActivityPriority, PriorityLevel } from '../Domain/ActivityPriority.js';
import { Repetition } from '../Domain/Repetition.js';
import type { IActivityRepository } from '../Domain/ActivityRepository.js';

export interface CreateActivityRequest {
  id: string;
  idUsuario: number;
  summary: string;
  start: EventDateTime;
  end: EventDateTime;
  created: string;
  updated: string;
  status: string;
  detailsId: number;
  description?: string;
  location?: string;
  idEtiqueta?: number;
  recurringEventId?: string;
  priorityId?: number;
  prioridad?: PriorityLevel;
  color?: string;
  repetitionId?: number;
  idFrecuencia?: number;
  diasSemana?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
}

export class CreateActivityUseCase {
  constructor(private activityRepository: IActivityRepository) {}

  async execute(request: CreateActivityRequest): Promise<Activity> {
    const details = new ActivityDetails(
      request.detailsId,
      parseInt(request.id),
      request.summary,
      request.description,
      request.location
    );

    let priority: ActivityPriority | undefined;
    if (request.priorityId && request.prioridad && request.color) {
      priority = new ActivityPriority(
        request.priorityId,
        parseInt(request.id),
        request.prioridad,
        request.color
      );
    }

    let repetition: Repetition | undefined;
    if (
      request.repetitionId &&
      request.idFrecuencia &&
      request.diasSemana &&
      request.fechaInicio &&
      request.fechaFin
    ) {
      repetition = new Repetition(
        request.repetitionId,
        parseInt(request.id),
        request.idFrecuencia,
        request.diasSemana,
        request.fechaInicio,
        request.fechaFin
      );
    }

    const activity = new Activity(
      request.id,
      request.idUsuario,
      request.summary,
      request.start,
      request.end,
      request.created,
      request.updated,
      request.status,
      details,
      request.idEtiqueta,
      request.recurringEventId,
      priority,
      repetition
    );

    await this.activityRepository.save(activity);

    return activity;
  }
}
