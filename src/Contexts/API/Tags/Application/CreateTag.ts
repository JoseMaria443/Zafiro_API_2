import { Tag } from '../Domain/Tag.js';
import type { ITagRepository } from '../Domain/TagRepository.js';
import { randomUUID } from 'crypto';

export interface CreateTagRequest {
  id?: string;
  idUsuario: string;
  nombre: string;
  color: string;
}

export class CreateTagUseCase {
  constructor(private tagRepository: ITagRepository) {}

  async execute(request: CreateTagRequest): Promise<Tag> {
    const existingTag = await this.tagRepository.findByUserIdAndName(
      request.idUsuario,
      request.nombre
    );

    if (existingTag) {
      throw new Error(`El tag "${request.nombre}" ya existe para este usuario`);
    }

    const tagId = request.id || randomUUID(); // Generate UUID if not provided

    const tag = new Tag(
      tagId,
      request.idUsuario,
      request.nombre,
      request.color
    );

    await this.tagRepository.save(tag);

    return tag;
  }
}
