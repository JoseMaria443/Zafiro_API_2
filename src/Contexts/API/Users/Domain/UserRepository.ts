import { User } from './User.js';
import { UserSettings } from './UserSettings.js';

export interface IUserRepository {
  save(user: User): Promise<void>;

  findOrCreateByClerkProfile(
    clerkUserId: string,
    correo: string,
    nombre: string,
  ): Promise<User>;

  findById(id: string): Promise<User | null>;

  findByClerkUserId(clerkUserId: string): Promise<User | null>;

  findByEmail(correo: string): Promise<User | null>;

  update(user: User): Promise<void>;

  delete(id: string): Promise<void>;

  exists(correo: string): Promise<boolean>;
}

export interface IUserSettingsRepository {
  save(settings: UserSettings): Promise<void>;

  findByUserId(idUsuario: string): Promise<UserSettings | null>;

  update(settings: UserSettings): Promise<void>;

  delete(idUsuario: string): Promise<void>;
}
