export class ActivityDetails {
  readonly title: string;
  readonly descripcion: string;
  readonly ubicacion: string;

  constructor(title: string, descripcion: string, ubicacion: string) {
    if (!title || title.trim().length === 0) {
      throw new Error('El título no puede estar vacío');
    }
    if (!descripcion || descripcion.trim().length === 0) {
      throw new Error('La descripción no puede estar vacía');
    }
    if (!ubicacion || ubicacion.trim().length === 0) {
      throw new Error('La ubicación no puede estar vacía');
    }

    this.title = title;
    this.descripcion = descripcion;
    this.ubicacion = ubicacion;
  }

  equals(other: ActivityDetails): boolean {
    return (
      this.title === other.title &&
      this.descripcion === other.descripcion &&
      this.ubicacion === other.ubicacion
    );
  }
}
