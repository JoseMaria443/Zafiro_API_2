import { Activity } from '../Domain/Activity.js';
import { ActivityDetails } from '../Domain/ActivityDetails.js';
import { ActivityPriority, PriorityLevel } from '../Domain/ActivityPriority.js';
import { Repetition, DayOfWeek } from '../Domain/Repetition.js';
import type { IActivityRepository } from '../Domain/ActivityRepository.js';

export interface CreateActivityRequest {
  id: string;
  idUsuario: number;
  idEtiqueta: number;
  title: string;
  descripcion: string;
  ubicacion: string;
  prioridad: PriorityLevel;
  color: string;
  idFrecuencia: number;
  diasSemana: DayOfWeek[];
  fechaInicio: Date;
  fechaFin: Date;
}

export class CreateActivityUseCase {
  constructor(private activityRepository: IActivityRepository) {}

  async execute(request: CreateActivityRequest): Promise<Activity> {
    const details = new ActivityDetails(
      request.title,
      request.descripcion,
      request.ubicacion
    );

    const priority = new ActivityPriority(request.prioridad, request.color);

    const repetition = new Repetition(
      request.idFrecuencia,
      request.diasSemana,
      request.fechaInicio,
      request.fechaFin
    );

    const activity = new Activity(
      request.id,
      request.idUsuario,
      request.idEtiqueta,
      details,
      priority,
      repetition
    );

    await this.activityRepository.save(activity);

    return activity;
  }
}
