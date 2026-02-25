import { Tag } from '../../Domain/Tag.js';
import type { ITagRepository } from '../../Domain/TagRepository.js';

export class MySqlTagRepository implements ITagRepository {
  async save(tag: Tag): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findById(id: string): Promise<Tag | null> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findByUserId(idUsuario: number): Promise<Tag[]> {
    throw new Error('Implementar con conexión MySQL');
  }

  async findByUserIdAndName(
    idUsuario: number,
    nombre: string
  ): Promise<Tag | null> {
    throw new Error('Implementar con conexión MySQL');
  }

  async update(tag: Tag): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Implementar con conexión MySQL');
  }
}
