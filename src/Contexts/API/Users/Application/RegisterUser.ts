import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { PasswordHasher } from '../../../Shared/Infrastructure/Security/PasswordHasher.js';

export interface RegisterUserRequest {
  correo: string;
  contrasenna: string;
  nombre: string;
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

    // Cifrar contraseña
    const hashedPassword = await this.passwordHasher.hash(request.contrasenna);

    // Temporal: usar ID 1 para crear el usuario, luego obtenerlo de la BD
    const tempUser = new User(
      1,
      request.correo,
      hashedPassword,
      request.nombre
    );

    await this.userRepository.save(tempUser);

    // Obtener el usuario recién creado con su ID real
    const savedUser = await this.userRepository.findByEmail(request.correo);
    
    if (!savedUser) {
      throw new Error('Error al crear el usuario');
    }

    return savedUser;
  }
}
