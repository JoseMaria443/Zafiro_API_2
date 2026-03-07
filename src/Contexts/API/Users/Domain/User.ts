export class User {
  readonly id: string; // UUID (formerly number)
  readonly clerkUserId: string; // Clerk authentication ID
  readonly correo: string;
  readonly password: string;
  readonly nombre: string;
  readonly tokenGoogle?: string;

  constructor(
    id: string,
    clerkUserId: string,
    correo: string,
    password: string,
    nombre: string,
    tokenGoogle?: string
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    if (!clerkUserId || clerkUserId.trim().length === 0) {
      throw new Error('Clerk User ID inválido');
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
    this.clerkUserId = clerkUserId;
    this.correo = correo;
    this.password = password;
    this.nombre = nombre;
    this.tokenGoogle = tokenGoogle;
  }
}
