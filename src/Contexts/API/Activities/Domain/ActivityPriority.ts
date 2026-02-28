export enum PriorityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class ActivityPriority {
  readonly id: number;
  readonly idActividad: number;
  readonly valor: PriorityLevel;
  readonly color: string;

  constructor(
    id: number,
    idActividad: number,
    valor: PriorityLevel,
    color: string
  ) {
    if (id < 1) {
      throw new Error('ID de prioridad inválido');
    }

    if (idActividad < 1) {
      throw new Error('ID de actividad inválido');
    }

    if (!Object.values(PriorityLevel).includes(valor)) {
      throw new Error(`Prioridad inválida: ${valor}`);
    }

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      throw new Error(`Color inválido: ${color}. Debe ser un hexadecimal válido`);
    }

    this.id = id;
    this.idActividad = idActividad;
    this.valor = valor;
    this.color = color;
  }

  isHigherThan(other: ActivityPriority): boolean {
    const priorityOrder = {
      [PriorityLevel.LOW]: 1,
      [PriorityLevel.MEDIUM]: 2,
      [PriorityLevel.HIGH]: 3,
      [PriorityLevel.CRITICAL]: 4,
    };
    return priorityOrder[this.valor] > priorityOrder[other.valor];
  }

  equals(other: ActivityPriority): boolean {
    return this.valor === other.valor && this.color === other.color;
  }
}
