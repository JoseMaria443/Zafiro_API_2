export class UserSettings {
  readonly id: string;
  readonly idUsuario: string; // UUID (formerly number)
  readonly ocupacion: string | undefined;
  readonly hora_inicio: string | undefined;
  readonly hora_fin: string | undefined;

  constructor(
    id: string,
    idUsuario: string,
    ocupacion?: string,
    hora_inicio?: string,
    hora_fin?: string
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de configuración inválido');
    }

    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

    if (hora_inicio !== undefined && !timeRegex.test(hora_inicio)) {
      throw new Error('La hora de inicio debe tener el formato HH:mm');
    }

    if (hora_fin !== undefined && !timeRegex.test(hora_fin)) {
      throw new Error('La hora de fin debe tener el formato HH:mm');
    }



    this.id = id;
    this.idUsuario = idUsuario;
    this.ocupacion = ocupacion;
    this.hora_inicio = hora_inicio;
    this.hora_fin = hora_fin;
  }

  isWithinWorkingHours(date: Date): boolean {
    if (this.hora_inicio === undefined || this.hora_fin === undefined) {
      return true;
    }

    const startHour = parseInt(this.hora_inicio.split(':')[0] || '0', 10);
    const endHour = parseInt(this.hora_fin.split(':')[0] || '0', 10);
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
      this.hora_inicio === other.hora_inicio &&
      this.hora_fin === other.hora_fin
    );
  }
}
