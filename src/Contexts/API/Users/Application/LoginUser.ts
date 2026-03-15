import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { ClerkService } from '../../../../Shared/Infrastructure/Security/ClerkService.js';


export interface LoginResponse {
  user: User;
  isNewUser: boolean;
}

export class LoginUserUseCase {
  private clerkService = new ClerkService();

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
      user = await this.userRepository.findOrCreateByClerkProfile(
        clerkUserInfo.clerkUserId,
        clerkUserInfo.correo,
        clerkUserInfo.nombre,
      );
    } else {
      // Sincroniza cambios de perfil de Clerk si los hay
      if (user.correo !== clerkUserInfo.correo || user.nombre !== clerkUserInfo.nombre) {
        const updatedUser = new User(
          user.id,
          user.clerkUserId,
          clerkUserInfo.correo,
          clerkUserInfo.nombre
        );
        await this.userRepository.update(updatedUser);
        user = updatedUser;
      } 
    }

    return { user, isNewUser };
  }
}
