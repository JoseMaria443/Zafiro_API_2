import { Tag } from '../Domain/Tag.js';
import type { ITagRepository } from '../Domain/TagRepository.js';

export interface UpdateTagRequest {
  id: string;
  nombre?: string;
  color?: string;
}

export class UpdateTagUseCase {
  constructor(private tagRepository: ITagRepository) {}

  async execute(request: UpdateTagRequest): Promise<Tag> {
    const tag = await this.tagRepository.findById(request.id);

    if (!tag) {
      throw new Error(`Tag con ID ${request.id} no encontrado`);
    }

    const updatedTag = new Tag(
      tag.id,
      tag.idUsuario,
      request.nombre || tag.nombre,
      request.color || tag.color,
      tag.createdAt,
      new Date()
    );

    await this.tagRepository.update(updatedTag);

    return updatedTag;
  }
}
