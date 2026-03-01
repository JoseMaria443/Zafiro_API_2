import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';

export class LoginUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(correo: string, contrasenna: string): Promise<User> {
    if (!correo || correo.trim().length === 0) {
      throw new Error('El correo es requerido');
    }

    if (!contrasenna || contrasenna.length === 0) {
      throw new Error('La contraseña es requerida');
    }

    const user = await this.userRepository.findByEmail(correo);

    if (!user) {
      throw new Error('Correo o contraseña inválidos');
    }

    if (user.password !== contrasenna) {
      throw new Error('Correo o contraseña inválidos');
    }

    return user;
  }
}
