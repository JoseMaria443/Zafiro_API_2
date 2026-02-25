import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';

export interface RegisterUserRequest {
  correo: string;
  password: string;
  nombre: string;
}

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: RegisterUserRequest): Promise<User> {
    const exists = await this.userRepository.exists(request.correo);

    if (exists) {
      throw new Error('El correo ya está registrado');
    }

    const user = new User(
      Math.floor(Math.random() * 1000000),
      request.correo,
      request.password,
      request.nombre
    );

    await this.userRepository.save(user);

    return user;
  }
}
