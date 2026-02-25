import { User } from '../../Domain/User.js';
import type { IUserRepository } from '../../Domain/UserRepository.js';

export class MySqlUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findById(id: number): Promise<User | null> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findByEmail(correo: string): Promise<User | null> {
    throw new Error('Implementar con conexión MySQL');
  }

  async update(user: User): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }

  async delete(id: number): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }

  async exists(correo: string): Promise<boolean> {
    throw new Error('Implementar con conexión MySQL');
  }
}
