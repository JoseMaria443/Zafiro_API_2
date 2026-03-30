export class UserSettings {
  readonly id: string;
  readonly idUsuario: string; // UUID (formerly number)
  readonly ocupacion: string | undefined;
  readonly horaInicio: string | undefined;
  readonly horaFin: string | undefined;

  constructor(
    id: string,
    idUsuario: string,
    ocupacion?: string,
    horaInicio?: string,
    horaFin?: string
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de configuración inválido');
    }

    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

    if (horaInicio !== undefined && !timeRegex.test(horaInicio)) {
      throw new Error('La hora de inicio debe tener el formato HH:mm');
    }

    if (horaFin !== undefined && !timeRegex.test(horaFin)) {
      throw new Error('La hora de fin debe tener el formato HH:mm');
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

    const startHour = parseInt(this.horaInicio.split(':')[0] || '0', 10);
    const endHour = parseInt(this.horaFin.split(':')[0] || '0', 10);
    const hour = date.getHours();
    
    if (startHour > endHour) {
      // El horario cruza la medianoche (ej. de 23:00 a 05:45)
      return hour >= startHour || hour < endHour;
    }
    
    // El horario es en el mismo día (ej. de 08:00 a 18:00)
    return hour >= startHour && hour < endHour;
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
