import {
  Activity,
  EventActor,
  EventDateTime,
  EventReminders,
} from '../Domain/Activity.js';
import { ActivityDetails } from '../Domain/ActivityDetails.js';
import { ActivityPriority, PriorityLevel } from '../Domain/ActivityPriority.js';
import type { IActivityRepository } from '../Domain/ActivityRepository.js';

export interface CreateActivityRequest {
  id: string;
  idUsuario: string;
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
  idEtiqueta?: number;
  recurringEventId?: string;
  originalStartTime?: EventDateTime;
  reminders?: EventReminders;
  etiqueta?: Record<string, unknown>;
  prioridad?: Record<string, unknown>;
  priorityId?: number;
  // RF-03 Fields
  horaInicio?: number;
  horaFin?: number;
  source?: 'local' | 'google';
  googleEventId?: string;
  frecuencia?: 'diaria' | 'semanal' | 'mensual' | 'anual';
  prioridadValor?: 'baja' | 'media' | 'alta';
  prioridadNivel?: PriorityLevel;
  color?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  location?: string;
  repetitionId?: number;
  idFrecuencia?: number;
  diasSemana?: any[];
}

export class CreateActivityUseCase {
  constructor(private activityRepository: IActivityRepository) {}

  private defaultPriorityColor(value: PriorityLevel): string {
    if (value === PriorityLevel.HIGH || value === PriorityLevel.CRITICAL) {
      return '#AB3535';
    }

    if (value === PriorityLevel.MEDIUM) {
      return '#E2761F';
    }

    return '#2FA941';
  }

  private toPriorityLevel(
    prioridadValor?: 'baja' | 'media' | 'alta',
    prioridadNivel?: PriorityLevel
  ): PriorityLevel | undefined {
    if (prioridadNivel) {
      return prioridadNivel;
    }

    if (prioridadValor === 'alta') {
      return PriorityLevel.HIGH;
    }

    if (prioridadValor === 'media') {
      return PriorityLevel.MEDIUM;
    }

    if (prioridadValor === 'baja') {
      return PriorityLevel.LOW;
    }

    return undefined;
  }

  async execute(request: CreateActivityRequest): Promise<Activity> {
    // Use UUID string or 1 as fallback for detailsId (it's not a foreign key, just a reference)
    const detailsId = 1; // Fixed value for now

    const details = new ActivityDetails(
      detailsId,
      request.id,
      request.summary,
      request.description,
      request.location
    );

    let priority: ActivityPriority | undefined;
    const priorityLevel = this.toPriorityLevel(request.prioridadValor, request.prioridadNivel);
    if (priorityLevel) {
      priority = new ActivityPriority(
        1, // Use fixed ID for now
        request.id,
        priorityLevel,
        request.color || this.defaultPriorityColor(priorityLevel)
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
      // RF-03 Fields
      request.fechaInicio,
      request.fechaFin,
      request.horaInicio,
      request.horaFin,
      request.source || 'local',
      request.googleEventId,
      request.frecuencia
    );

    await this.activityRepository.save(activity);

    return activity;
  }
}
