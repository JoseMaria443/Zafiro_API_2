import { ActivityDetails } from './ActivityDetails.js';
import { ActivityPriority } from './ActivityPriority.js';
import { Repetition } from './Repetition.js';

export class Activity {
  readonly id: number;
  readonly idClerk: number;
  readonly idUsuario: number;
  readonly idEtiqueta: number;
  readonly fechaCreacion: string;
  readonly details: ActivityDetails;
  readonly priority: ActivityPriority;
  readonly repetition: Repetition;

  constructor(
    id: number,
    idClerk: number,
    idUsuario: number,
    idEtiqueta: number,
    fechaCreacion: string,
    details: ActivityDetails,
    priority: ActivityPriority,
    repetition: Repetition
  ) {
    if (id < 1) {
      throw new Error('ID de actividad inválido');
    }

    if (idClerk < 1) {
      throw new Error('ID de clerk inválido');
    }

    if (idUsuario < 1) {
      throw new Error('ID de usuario inválido');
    }

    if (idEtiqueta < 1) {
      throw new Error('ID de etiqueta inválido');
    }

    if (!fechaCreacion || fechaCreacion.trim().length === 0) {
      throw new Error('La fecha de creación no puede estar vacía');
    }

    this.id = id;
    this.idClerk = idClerk;
    this.idUsuario = idUsuario;
    this.idEtiqueta = idEtiqueta;
    this.fechaCreacion = fechaCreacion;
    this.details = details;
    this.priority = priority;
    this.repetition = repetition;
  }

  occursOn(date: Date): boolean {
    return this.repetition.fechaInicio <= date && date <= this.repetition.fechaFin;
  }

  isActive(): boolean {
    return this.repetition.isActive();
  }
}
