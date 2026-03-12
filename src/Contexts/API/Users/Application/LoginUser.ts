import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { JwtTokenGenerator } from '../../../../Shared/Infrastructure/Security/JwtTokenGenerator.js';
import { ClerkService } from '../../../../Shared/Infrastructure/Security/ClerkService.js';
import { PasswordHasher } from '../../../../Shared/Infrastructure/Security/PasswordHasher.js';
import { randomUUID } from 'crypto';

export interface LoginResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

export class LoginUserUseCase {
  private jwtGenerator = new JwtTokenGenerator();
  private clerkService = new ClerkService();
  private passwordHasher = new PasswordHasher();

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
      const tempPasswordHash = await this.passwordHasher.hash(randomUUID());

      user = await this.userRepository.findOrCreateByClerkProfile(
        clerkUserInfo.clerkUserId,
        clerkUserInfo.correo,
        clerkUserInfo.nombre,
        tempPasswordHash
      );
      console.log(`    Usuario creado exitosamente en BD con ID: ${user.id}`);
    } else {
      // Sincroniza cambios de perfil básicos de Clerk.
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

      console.log(`    Usuario existente encontrado con ID: ${user.id}`);
    }

    // Generar JWT del API (para operaciones internas del API)
    const token = this.jwtGenerator.generateToken({
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
      clerkUserId: user.clerkUserId,
    });

    return { user, token, isNewUser };
  }

  /**
   * Login legado con correo/contraseña (mantenido para backward compatibility)
   */
  async executeWithEmailPassword(
    correo: string,
    contrasenna: string
  ): Promise<LoginResponse> {
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

    // Generar JWT
    const token = this.jwtGenerator.generateToken({
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
      clerkUserId: user.clerkUserId,
    });

    return { user, token, isNewUser: false };
  }
}

