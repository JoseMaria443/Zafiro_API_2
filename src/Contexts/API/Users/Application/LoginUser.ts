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

  /**
   * Login con Clerk token
   * Si el usuario no existe, lo crea automáticamente
   */
  async execute(clerkToken: string): Promise<LoginResponse> {
    if (!clerkToken || clerkToken.trim().length === 0) {
      throw new Error('Token de Clerk requerido');
    }

    console.log('   → Validando token con Clerk...');
    // Validar token de Clerk y obtener información del usuario
    const clerkUserInfo = await this.clerkService.validateToken(clerkToken);
    console.log(`   → Token válido para: ${clerkUserInfo.correo}`);

    // Buscar usuario existente por clerk_user_id
    console.log(`   → Buscando usuario en BD con Clerk ID: ${clerkUserInfo.clerkUserId}`);
    let user = await this.userRepository.findByClerkUserId(clerkUserInfo.clerkUserId);
    let isNewUser = false;

    if (!user) {
      // Usuario no existe, crear uno nuevo
      console.log('   → Usuario NO encontrado, creando nuevo usuario en BD...');
      isNewUser = true;

      user = await this.userRepository.findOrCreateByClerkProfile(
        clerkUserInfo.clerkUserId,
        clerkUserInfo.correo,
        clerkUserInfo.nombre
      );
      console.log(`    Usuario creado exitosamente en BD con ID: ${user.id}`);
    } else {
      // Sincroniza cambios de perfil básicos de Clerk.
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

      console.log(`    Usuario existente encontrado con ID: ${user.id}`);
    }

    return { user, isNewUser };
  }
}

