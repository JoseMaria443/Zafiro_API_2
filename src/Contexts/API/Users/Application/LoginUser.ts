import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { ClerkService } from '../../../../Shared/Infrastructure/Security/ClerkService.js';
import { PasswordHasher } from '../../../../Shared/Infrastructure/Security/PasswordHasher.js';
import { randomUUID } from 'crypto';

export interface LoginResponse {
  user: User;
  isNewUser: boolean;
}

export class LoginUserUseCase {
  private clerkService = new ClerkService();
  private passwordHasher = new PasswordHasher();

  constructor(private userRepository: IUserRepository) {}

  async execute(clerkToken: string): Promise<LoginResponse> {
    if (!clerkToken || clerkToken.trim().length === 0) {
      throw new Error('Token de Clerk requerido');
    }

    const clerkUserInfo = await this.clerkService.validateToken(clerkToken);

    let user = await this.userRepository.findByClerkUserId(clerkUserInfo.clerkUserId);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const tempPasswordHash = await this.passwordHasher.hash(randomUUID());

      user = await this.userRepository.findOrCreateByClerkProfile(
        clerkUserInfo.clerkUserId,
        clerkUserInfo.correo,
        clerkUserInfo.nombre,
        tempPasswordHash
      );
    } else {
      // Sincroniza cambios de perfil de Clerk si los hay
      if (user.correo !== clerkUserInfo.correo || user.nombre !== clerkUserInfo.nombre) {
        const updatedUser = new User(
          user.id,
          user.clerkUserId,
          clerkUserInfo.correo,
          user.password,
          clerkUserInfo.nombre
        );
        await this.userRepository.update(updatedUser);
        user = updatedUser;
      }
    }

    return { user, isNewUser };
  }
}