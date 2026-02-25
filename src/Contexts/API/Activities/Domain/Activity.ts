import { ActivityDetails } from './ActivityDetails.js';
import { ActivityPriority } from './ActivityPriority.js';
import { Repetition } from './Repetition.js';

export class Activity {
  readonly id: string;
  readonly idUsuario: number;
  readonly idEtiqueta: number;
  readonly details: ActivityDetails;
  readonly priority: ActivityPriority;
  readonly repetition: Repetition;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    idUsuario: number,
    idEtiqueta: number,
    details: ActivityDetails,
    priority: ActivityPriority,
    repetition: Repetition,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('El ID de la actividad no puede estar vacío');
    }

    if (idUsuario < 1) {
      throw new Error('ID de usuario inválido');
    }

    if (idEtiqueta < 1) {
      throw new Error('ID de etiqueta inválido');
    }

    this.id = id;
    this.idUsuario = idUsuario;
    this.idEtiqueta = idEtiqueta;
    this.details = details;
    this.priority = priority;
    this.repetition = repetition;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  occursOn(date: Date): boolean {
    return this.repetition.isOccurringOn(date);
  }

  isActive(): boolean {
    return this.repetition.isActive();
  }
}
