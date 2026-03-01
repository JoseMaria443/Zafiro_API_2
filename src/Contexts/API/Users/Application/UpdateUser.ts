import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { PasswordHasher } from '../../../Shared/Infrastructure/Security/PasswordHasher.js';

export interface UpdateUserRequest {
  id: number;
  nombre?: string;
  contrasenna?: string;
  tokenGoogle?: string;
}

export class UpdateUserUseCase {
  private passwordHasher = new PasswordHasher();

  constructor(private userRepository: IUserRepository) {}

  async execute(request: UpdateUserRequest): Promise<User> {
    const user = await this.userRepository.findById(request.id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let passwordToUse = user.password;

    // Si se proporciona nueva contraseña, cifrarla
    if (request.contrasenna) {
      if (request.contrasenna.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      passwordToUse = await this.passwordHasher.hash(request.contrasenna);
    }

    const updatedUser = new User(
      user.id,
      user.correo,
      passwordToUse,
      request.nombre || user.nombre,
      request.tokenGoogle || user.tokenGoogle
    );

    await this.userRepository.update(updatedUser);

    return updatedUser;
  }
}
