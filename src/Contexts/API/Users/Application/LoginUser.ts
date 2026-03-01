import { User } from '../Domain/User.js';
import type { IUserRepository } from '../Domain/UserRepository.js';
import { PasswordHasher } from '../../../Shared/Infrastructure/Security/PasswordHasher.js';
import { JwtTokenGenerator } from '../../../Shared/Infrastructure/Security/JwtTokenGenerator.js';

export interface LoginResponse {
  user: User;
  token: string;
}

export class LoginUserUseCase {
  private passwordHasher = new PasswordHasher();
  private jwtGenerator = new JwtTokenGenerator();

  constructor(private userRepository: IUserRepository) {}

  async execute(correo: string, contrasenna: string): Promise<LoginResponse> {
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

    // Verificar contraseña contra el hash almacenado
    const isPasswordValid = await this.passwordHasher.verify(contrasenna, user.password);

    if (!isPasswordValid) {
      throw new Error('Correo o contraseña inválidos');
    }

    // Generar JWT
    const token = this.jwtGenerator.generateToken({
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
    });

    return { user, token };
  }
}
