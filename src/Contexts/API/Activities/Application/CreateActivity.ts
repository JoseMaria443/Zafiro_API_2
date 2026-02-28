import { Activity } from '../Domain/Activity.js';
import { ActivityDetails } from '../Domain/ActivityDetails.js';
import { ActivityPriority, PriorityLevel } from '../Domain/ActivityPriority.js';
import { Repetition } from '../Domain/Repetition.js';
import type { IActivityRepository } from '../Domain/ActivityRepository.js';

export interface CreateActivityRequest {
  id: number;
  idClerk: number;
  idUsuario: number;
  idEtiqueta: number;
  fechaCreacion: string;
  detailsId: number;
  title: string;
  descripcion: string;
  Ubicacion: string;
  priorityId: number;
  prioridad: PriorityLevel;
  color: string;
  repetitionId: number;
  idFrecuencia: number;
  diasSemana: string;
  fechaInicio: Date;
  fechaFin: Date;
}

export class CreateActivityUseCase {
  constructor(private activityRepository: IActivityRepository) {}

  async execute(request: CreateActivityRequest): Promise<Activity> {
    const details = new ActivityDetails(
      request.detailsId,
      request.id,
      request.title,
      request.descripcion,
      request.Ubicacion
    );

    const priority = new ActivityPriority(
      request.priorityId,
      request.id,
      request.prioridad,
      request.color
    );

    const repetition = new Repetition(
      request.repetitionId,
      request.id,
      request.idFrecuencia,
      request.diasSemana,
      request.fechaInicio,
      request.fechaFin
    );

    const activity = new Activity(
      request.id,
      request.idClerk,
      request.idUsuario,
      request.idEtiqueta,
      request.fechaCreacion,
      details,
      priority,
      repetition
    );

    await this.activityRepository.save(activity);

    return activity;
  }
}
