export enum PriorityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class ActivityPriority {
  readonly valor: PriorityLevel;
  readonly colores: string;

  constructor(valor: PriorityLevel, colores: string) {
    if (!Object.values(PriorityLevel).includes(valor)) {
      throw new Error(`Prioridad inválida: ${valor}`);
    }

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(colores)) {
      throw new Error(`Color inválido: ${colores}. Debe ser un hexadecimal válido`);
    }

    this.valor = valor;
    this.colores = colores;
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
    return this.valor === other.valor && this.colores === other.colores;
  }
}
