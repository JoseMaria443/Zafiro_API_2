import { ActivityDetails } from './ActivityDetails.js';
import { ActivityPriority } from './ActivityPriority.js';
import { Repetition } from './Repetition.js';

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export class Activity {
  readonly id: string;
  readonly idUsuario: number;
  readonly idEtiqueta?: number;
  readonly summary: string;
  readonly start: EventDateTime;
  readonly end: EventDateTime;
  readonly created: string;
  readonly updated: string;
  readonly recurringEventId?: string;
  readonly status: string;
  readonly details: ActivityDetails;
  readonly priority?: ActivityPriority;
  readonly repetition?: Repetition;

  constructor(
    id: string,
    idUsuario: number,
    summary: string,
    start: EventDateTime,
    end: EventDateTime,
    created: string,
    updated: string,
    status: string,
    details: ActivityDetails,
    idEtiqueta?: number,
    recurringEventId?: string,
    priority?: ActivityPriority,
    repetition?: Repetition
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de actividad inválido');
    }

    if (idUsuario < 1) {
      throw new Error('ID de usuario inválido');
    }

    if (!summary || summary.trim().length === 0) {
      throw new Error('El resumen (summary) no puede estar vacío');
    }

    if (!start || (!start.dateTime && !start.date)) {
      throw new Error('La fecha de inicio no puede estar vacía');
    }

    if (!end || (!end.dateTime && !end.date)) {
      throw new Error('La fecha de fin no puede estar vacía');
    }

    if (!created || created.trim().length === 0) {
      throw new Error('La fecha de creación no puede estar vacía');
    }

    if (!updated || updated.trim().length === 0) {
      throw new Error('La fecha de actualización no puede estar vacía');
    }

    if (!status || status.trim().length === 0) {
      throw new Error('El estado no puede estar vacío');
    }

    this.id = id;
    this.idUsuario = idUsuario;
    this.idEtiqueta = idEtiqueta;
    this.summary = summary;
    this.start = start;
    this.end = end;
    this.created = created;
    this.updated = updated;
    this.status = status;
    this.recurringEventId = recurringEventId;
    this.details = details;
    this.priority = priority;
    this.repetition = repetition;
  }

  isWithinDateRange(date: Date): boolean {
    if (this.repetition) {
      return this.repetition.isActive(date);
    }
    return true;
  }
}
