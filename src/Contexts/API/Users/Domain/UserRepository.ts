import { User } from './User.js';

export interface IUserRepository {
  save(user: User): Promise<void>;

  findById(id: number): Promise<User | null>;

  findByEmail(correo: string): Promise<User | null>;

  update(user: User): Promise<void>;

  delete(id: number): Promise<void>;

  exists(correo: string): Promise<boolean>;
}
