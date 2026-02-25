export class User {
  readonly id: number;
  readonly correo: string;
  readonly password: string;
  readonly nombre: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: number,
    correo: string,
    password: string,
    nombre: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    if (id < 1) {
      throw new Error('ID de usuario inválido');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      throw new Error('Correo inválido');
    }

    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }

    this.id = id;
    this.correo = correo;
    this.password = password;
    this.nombre = nombre;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
