export class ActivityDetails {
  readonly id: number;
  readonly idActividad: number;
  readonly title: string;
  readonly descripcion: string;
  readonly Ubicacion: string;

  constructor(
    id: number,
    idActividad: number,
    title: string,
    descripcion: string,
    Ubicacion: string
  ) {
    if (id < 1) {
      throw new Error('ID de detalles inválido');
    }

    if (idActividad < 1) {
      throw new Error('ID de actividad inválido');
    }

    if (!title || title.trim().length === 0) {
      throw new Error('El título no puede estar vacío');
    }
    if (!descripcion || descripcion.trim().length === 0) {
      throw new Error('La descripción no puede estar vacía');
    }
    if (!Ubicacion || Ubicacion.trim().length === 0) {
      throw new Error('La ubicación no puede estar vacía');
    }

    this.id = id;
    this.idActividad = idActividad;
    this.title = title;
    this.descripcion = descripcion;
    this.Ubicacion = Ubicacion;
  }

  equals(other: ActivityDetails): boolean {
    return (
      this.title === other.title &&
      this.descripcion === other.descripcion &&
      this.Ubicacion === other.Ubicacion
    );
  }
}
