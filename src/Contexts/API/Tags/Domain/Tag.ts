export class Tag {
  readonly id: number;
  readonly idUsuario: string;
  readonly nombre: string;
  readonly color: string;

  constructor(
    id: number,
    idUsuario: string,
    nombre: string,
    color: string
  ) {
    if (!Number.isInteger(id) || id < 1) {
      throw new Error('El ID del tag no puede estar vacío');
    }

    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del tag no puede estar vacío');
    }

    if (nombre.length > 50) {
      throw new Error('El nombre del tag no puede exceder 50 caracteres');
    }

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      throw new Error(`Color inválido: ${color}. Debe ser un hexadecimal válido`);
    }

    this.id = id;
    this.idUsuario = idUsuario;
    this.nombre = nombre;
    this.color = color;
  }
}
