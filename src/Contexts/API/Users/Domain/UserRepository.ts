import { User } from './User.js';
import { UserSettings } from './UserSettings.js';

export interface IUserRepository {
  save(user: User): Promise<void>;

  findById(id: number): Promise<User | null>;

  findByEmail(correo: string): Promise<User | null>;

  update(user: User): Promise<void>;

  delete(id: number): Promise<void>;

  exists(correo: string): Promise<boolean>;
}

export interface IUserSettingsRepository {
  save(settings: UserSettings): Promise<void>;

  findByUserId(idUsuario: number): Promise<UserSettings | null>;

  update(settings: UserSettings): Promise<void>;

  delete(idUsuario: number): Promise<void>;
}
