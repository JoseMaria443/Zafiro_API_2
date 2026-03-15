import { Tag } from '../Domain/Tag.js';
import type { ITagRepository } from '../Domain/TagRepository.js';

export interface CreateTagRequest {
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

    // El id real lo asigna PostgreSQL (IDENTITY) en el repositorio.
    const tagId = 1;

    const tag = new Tag(
      tagId,
      request.idUsuario,
      request.nombre,
      request.color
    );

    return await this.tagRepository.save(tag);
  }
}
