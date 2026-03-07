import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { PasswordHasher } from '../../../../Shared/Infrastructure/Security/PasswordHasher.js';
import { randomUUID } from 'crypto';

export interface RegisterUserRequest {
  correo: string;
  contrasenna: string;
  nombre: string;
  clerkUserId: string;
}

export class RegisterUserUseCase {
  private passwordHasher = new PasswordHasher();

  constructor(private userRepository: IUserRepository) {}

  async execute(request: RegisterUserRequest): Promise<User> {
    const exists = await this.userRepository.exists(request.correo);

    if (exists) {
      throw new Error('El correo ya está registrado');
    }

    // Validar contraseña
    if (request.contrasenna.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    if (!request.clerkUserId || request.clerkUserId.trim().length === 0) {
      throw new Error('Clerk User ID es requerido');
    }

    // Cifrar contraseña
    const hashedPassword = await this.passwordHasher.hash(request.contrasenna);
    const userId = randomUUID(); // Generate UUID for the user

    // Crear usuario con UUID y clerk_user_id
    const newUser = new User(
      userId,
      request.clerkUserId,
      request.correo,
      hashedPassword,
      request.nombre
    );

    await this.userRepository.save(newUser);

    // Obtener el usuario recién creado
    const savedUser = await this.userRepository.findByEmail(request.correo);
    
    if (!savedUser) {
      throw new Error('Error al crear el usuario');
    }

    return savedUser;
  }
}

