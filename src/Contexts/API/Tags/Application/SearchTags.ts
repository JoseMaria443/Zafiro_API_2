import { Tag } from '../Domain/Tag.js';
import type { ITagRepository } from '../Domain/TagRepository.js';

export class SearchTagsUseCase {
  constructor(private tagRepository: ITagRepository) {}

  async allTagsByUser(idUsuario: string): Promise<Tag[]> {
    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    return await this.tagRepository.findByUserId(idUsuario);
  }

  async tagById(id: number): Promise<Tag | null> {
    if (id < 1) {
      throw new Error('ID de tag inválido');
    }

    return await this.tagRepository.findById(id);
  }

  async tagByUserIdAndName(
    idUsuario: string,
    nombre: string
  ): Promise<Tag | null> {
    if (!idUsuario || idUsuario.trim().length === 0) {
      throw new Error('ID de usuario inválido');
    }

    if (!nombre || nombre.trim().length === 0) {
      throw new Error('Nombre de tag inválido');
    }

    return await this.tagRepository.findByUserIdAndName(idUsuario, nombre);
  }
}
