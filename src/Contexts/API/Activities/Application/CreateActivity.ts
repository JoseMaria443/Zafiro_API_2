import {
  Activity,
  EventActor,
  EventDateTime,
  EventReminders,
} from '../Domain/Activity.js';
import { ActivityDetails } from '../Domain/ActivityDetails.js';
import { ActivityPriority, PriorityLevel } from '../Domain/ActivityPriority.js';
import { Repetition } from '../Domain/Repetition.js';
import type { IActivityRepository } from '../Domain/ActivityRepository.js';

export interface CreateActivityRequest {
  id: string;
  idUsuario: number;
  kind?: string;
  etag?: string;
  htmlLink?: string;
  summary: string;
  creator?: EventActor;
  organizer?: EventActor;
  start: EventDateTime;
  end: EventDateTime;
  created?: string;
  updated?: string;
  iCalUID?: string;
  sequence?: number;
  transparency?: 'transparent' | 'opaque';
  eventType?: 'default' | 'focusTime' | 'outOfOffice';
  recurrence?: string[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
  detailsId?: number;
  description?: string;
  location?: string;
  idEtiqueta?: number;
  recurringEventId?: string;
  originalStartTime?: EventDateTime;
  reminders?: EventReminders;
  etiqueta?: Record<string, unknown>;
  prioridad?: Record<string, unknown>;
  priorityId?: number;
  prioridadNivel?: PriorityLevel;
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
    const detailsId = request.detailsId ?? 1;

    const details = new ActivityDetails(
      detailsId,
      request.id,
      request.summary,
      request.description,
      request.location
    );

    let priority: ActivityPriority | undefined;
    if (request.priorityId && request.prioridadNivel && request.color) {
      priority = new ActivityPriority(
        request.priorityId,
        detailsId,
        request.prioridadNivel,
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
        detailsId,
        request.idFrecuencia,
        request.diasSemana,
        request.fechaInicio,
        request.fechaFin
      );
    }

    const created = request.created ?? new Date().toISOString();
    const updated = request.updated ?? created;
    const status = request.status ?? 'confirmed';

    const activity = new Activity(
      request.id,
      request.idUsuario,
      request.summary,
      request.start,
      request.end,
      created,
      updated,
      status,
      details,
      request.idEtiqueta,
      request.kind,
      request.etag,
      request.htmlLink,
      request.creator,
      request.organizer,
      request.iCalUID,
      request.sequence,
      request.transparency,
      request.eventType,
      request.recurrence,
      request.recurringEventId,
      request.originalStartTime,
      request.reminders,
      request.etiqueta,
      request.prioridad,
      priority,
      repetition
    );

    await this.activityRepository.save(activity);

    return activity;
  }
}
