export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export class Repetition {
  readonly id: string | undefined;
  readonly idFrecuencia: number;
  readonly diasSemana: DayOfWeek[];
  readonly fechaInicio: Date;
  readonly fechaFin: Date;

  constructor(
    idFrecuencia: number,
    diasSemana: DayOfWeek[],
    fechaInicio: Date,
    fechaFin: Date,
    id: string | undefined = undefined
  ) {
    if (idFrecuencia < 1) {
      throw new Error('ID de frecuencia inválido');
    }

    if (diasSemana.length === 0) {
      throw new Error('Debe especificar al menos un día de la semana');
    }

    if (isNaN(fechaInicio.getTime())) {
      throw new Error('Fecha de inicio inválida');
    }

    if (isNaN(fechaFin.getTime())) {
      throw new Error('Fecha de fin inválida');
    }

    if (fechaInicio >= fechaFin) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    this.id = id;
    this.idFrecuencia = idFrecuencia;
    this.diasSemana = diasSemana;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
  }

  isActive(date: Date = new Date()): boolean {
    return date >= this.fechaInicio && date <= this.fechaFin;
  }

  isOccurringOn(date: Date): boolean {
    const dayIndex = date.getDay();
    const dayMap = [DayOfWeek.SUN, DayOfWeek.MON, DayOfWeek.TUE, DayOfWeek.WED, DayOfWeek.THU, DayOfWeek.FRI, DayOfWeek.SAT];
    const dayOfWeek = dayMap[dayIndex];

    return this.isActive(date) && dayOfWeek !== undefined && this.diasSemana.includes(dayOfWeek);
  }
}
