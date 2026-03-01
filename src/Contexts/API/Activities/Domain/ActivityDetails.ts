export class ActivityDetails {
  readonly id: number;
  readonly idActividad: string;
  readonly summary: string;
  readonly description?: string;
  readonly location?: string;

  constructor(
    id: number,
    idActividad: string,
    summary: string,
    description?: string,
    location?: string
  ) {
    if (id < 1) {
      throw new Error('ID de detalles inválido');
    }

    if (!idActividad || idActividad.trim().length === 0) {
      throw new Error('ID de actividad inválido');
    }

    if (!summary || summary.trim().length === 0) {
      throw new Error('El resumen (summary) no puede estar vacío');
    }

    this.id = id;
    this.idActividad = idActividad;
    this.summary = summary;
    this.description = description;
    this.location = location;
  }

  equals(other: ActivityDetails): boolean {
    return (
      this.summary === other.summary &&
      this.description === other.description &&
      this.location === other.location
    );
  }
}
