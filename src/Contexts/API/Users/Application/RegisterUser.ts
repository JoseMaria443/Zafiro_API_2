import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';

export interface RegisterUserRequest {
  correo: string;
  contrasenna: string;
  nombre: string;
}

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: RegisterUserRequest): Promise<User> {
    const exists = await this.userRepository.exists(request.correo);

    if (exists) {
      throw new Error('El correo ya está registrado');
    }

    // Temporal: usar ID 1 para crear el usuario, luego obtenerlo de la BD
    const tempUser = new User(
      1,
      request.correo,
      request.contrasenna,
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
