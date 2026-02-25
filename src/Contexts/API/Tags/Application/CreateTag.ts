import { Tag } from '../Domain/Tag.js';
import type { ITagRepository } from '../Domain/TagRepository.js';

export interface CreateTagRequest {
  id: string;
  idUsuario: number;
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

    const tag = new Tag(
      request.id,
      request.idUsuario,
      request.nombre,
      request.color
    );

    await this.tagRepository.save(tag);

    return tag;
  }
}
