import { Tag } from '../Domain/Tag.js';
import type { ITagRepository } from '../Domain/TagRepository.js';

export class SearchTagsUseCase {
  constructor(private tagRepository: ITagRepository) {}

  async allTagsByUser(idUsuario: number): Promise<Tag[]> {
    if (idUsuario < 1) {
      throw new Error('ID de usuario inválido');
    }

    return await this.tagRepository.findByUserId(idUsuario);
  }

  async tagById(id: string): Promise<Tag | null> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de tag inválido');
    }

    return await this.tagRepository.findById(id);
  }

  async tagByUserIdAndName(
    idUsuario: number,
    nombre: string
  ): Promise<Tag | null> {
    if (idUsuario < 1) {
      throw new Error('ID de usuario inválido');
    }

    if (!nombre || nombre.trim().length === 0) {
      throw new Error('Nombre de tag inválido');
    }

    return await this.tagRepository.findByUserIdAndName(idUsuario, nombre);
  }
}
