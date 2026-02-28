export class Repetition {
  readonly id: number;
  readonly idActividad: number;
  readonly idFrecuencia: number;
  readonly diasSemana: string;
  readonly fechaInicio: Date;
  readonly fechaFin: Date;

  constructor(
    id: number,
    idActividad: number,
    idFrecuencia: number,
    diasSemana: string,
    fechaInicio: Date,
    fechaFin: Date
  ) {
    if (id < 1) {
      throw new Error('ID de repetición inválido');
    }

    if (idActividad < 1) {
      throw new Error('ID de actividad inválido');
    }

    if (idFrecuencia < 1) {
      throw new Error('ID de frecuencia inválido');
    }

    if (!diasSemana || diasSemana.trim().length === 0) {
      throw new Error('Debe especificar los días de la semana');
    }

    if (diasSemana.length > 25) {
      throw new Error('Los días de la semana no pueden exceder 25 caracteres');
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
    this.idActividad = idActividad;
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
    const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayOfWeek = dayMap[dayIndex];

    return this.isActive(date) && dayOfWeek !== undefined && this.diasSemana.includes(dayOfWeek);
  }
}
