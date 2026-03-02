export class UserSettings {
  readonly id: string;
  readonly idUsuario: string;
  readonly ocupacion: string | undefined;
  readonly horaInicio: number | undefined;
  readonly horaFin: number | undefined;

  constructor(
    id: string,
    idUsuario: string,
    ocupacion?: string,
    horaInicio?: number,
    horaFin?: number
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de configuración inválido');
    }

    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

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
    this.ocupacion = ocupacion;
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
  }

  isWithinWorkingHours(date: Date): boolean {
    if (this.horaInicio === undefined || this.horaFin === undefined) {
      return true;
    }

    const hour = date.getHours();
    return hour >= this.horaInicio && hour < this.horaFin;
  }

  equals(other: UserSettings): boolean {
    return (
      this.idUsuario === other.idUsuario &&
      this.ocupacion === other.ocupacion &&
      this.horaInicio === other.horaInicio &&
      this.horaFin === other.horaFin
    );
  }
}
