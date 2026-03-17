import { ActivityDetails } from './ActivityDetails.js';
import { ActivityPriority } from './ActivityPriority.js';
import { Repetition } from './Repetition.js';

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface EventActor {
  email?: string;
  displayName?: string;
  self?: boolean;
}

export interface EventReminder {
  method: 'email' | 'popup';
  minutes: number;
}

export interface EventReminders {
  useDefault: boolean;
  overrides?: EventReminder[];
}

export class Activity {
  readonly id: string;
  readonly idUsuario: string;
  readonly idEtiqueta?: number;
  readonly kind?: string;
  readonly etag?: string;
  readonly htmlLink?: string;
  readonly summary: string;
  readonly creator?: EventActor;
  readonly organizer?: EventActor;
  readonly start: EventDateTime;
  readonly end: EventDateTime;
  readonly created: string;
  readonly updated: string;
  readonly iCalUID?: string;
  readonly sequence?: number;
  readonly transparency?: 'transparent' | 'opaque';
  readonly eventType?: 'default' | 'focusTime' | 'outOfOffice';
  readonly recurrence?: string[];
  readonly recurringEventId?: string;
  readonly originalStartTime?: EventDateTime;
  readonly reminders?: EventReminders;
  readonly etiqueta?: Record<string, unknown>;
  readonly prioridad?: Record<string, unknown>;
  readonly status: string;
  readonly details: ActivityDetails;
  readonly priority?: ActivityPriority;
  readonly repetition?: Repetition;
  // RF-03 Fields
  readonly fechaInicio?: Date; // Start date (format: YYYY-MM-DD)
  readonly fechaFin?: Date; // End date (format: YYYY-MM-DD)
  readonly horaInicio?: number; // Start hour (0-23)
  readonly horaFin?: number; // End hour (0-23)
  readonly source?: 'local' | 'google'; // Source of the activity
  readonly googleEventId?: string; // Google Calendar event ID
  readonly frecuencia?: 'diaria' | 'semanal' | 'mensual' | 'anual'; // Frequency

  constructor(
    id: string,
    idUsuario: string,
    summary: string,
    start: EventDateTime,
    end: EventDateTime,
    created: string,
    updated: string,
    status: string,
    details: ActivityDetails,
    idEtiqueta?: number,
    kind?: string,
    etag?: string,
    htmlLink?: string,
    creator?: EventActor,
    organizer?: EventActor,
    iCalUID?: string,
    sequence?: number,
    transparency?: 'transparent' | 'opaque',
    eventType?: 'default' | 'focusTime' | 'outOfOffice',
    recurrence?: string[],
    recurringEventId?: string,
    originalStartTime?: EventDateTime,
    reminders?: EventReminders,
    etiqueta?: Record<string, unknown>,
    prioridad?: Record<string, unknown>,
    priority?: ActivityPriority,
    repetition?: Repetition,
    // RF-03 Parameters
    fechaInicio?: Date,
    fechaFin?: Date,
    horaInicio?: number,
    horaFin?: number,
    source?: 'local' | 'google',
    googleEventId?: string,
    frecuencia?: 'diaria' | 'semanal' | 'mensual' | 'anual'
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de actividad inválido');
    }

    if (!idUsuario || idUsuario.trim().length === 0) {
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

    // Validar RF-03 fields
    if (horaInicio !== undefined && (horaInicio < 0 || horaInicio > 23)) {
      throw new Error('La hora de inicio debe estar entre 0 y 23');
    }

    if (horaFin !== undefined && (horaFin < 0 || horaFin > 23)) {
      throw new Error('La hora de fin debe estar entre 0 y 23');
    }

    if (horaInicio !== undefined && horaFin !== undefined && horaInicio >= horaFin) {
      throw new Error('La hora de inicio debe ser anterior a la hora de fin');
    }

    this.id = id;
    this.idUsuario = idUsuario;
    this.idEtiqueta = idEtiqueta;
    this.kind = kind;
    this.etag = etag;
    this.htmlLink = htmlLink;
    this.summary = summary;
    this.creator = creator;
    this.organizer = organizer;
    this.start = start;
    this.end = end;
    this.created = created;
    this.updated = updated;
    this.iCalUID = iCalUID;
    this.sequence = sequence;
    this.transparency = transparency;
    this.eventType = eventType;
    this.recurrence = recurrence;
    this.status = status;
    this.recurringEventId = recurringEventId;
    this.originalStartTime = originalStartTime;
    this.reminders = reminders;
    this.etiqueta = etiqueta;
    this.prioridad = prioridad;
    this.details = details;
    this.priority = priority;
    this.repetition = repetition;
    // RF-03 Fields
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
    this.source = source;
    this.googleEventId = googleEventId;
    this.frecuencia = frecuencia;
  }

  isWithinDateRange(date: Date): boolean {
    if (this.repetition) {
      return this.repetition.isActive(date);
    }
    return true;
  }
}
