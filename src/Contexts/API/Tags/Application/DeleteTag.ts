import type { ITagRepository } from '../Domain/TagRepository.js';

export class DeleteTagUseCase {
  constructor(private tagRepository: ITagRepository) {}

  async execute(id: number): Promise<void> {
    if (id < 1) {
      throw new Error('ID de tag inválido');
    }

    const tag = await this.tagRepository.findById(id);

    if (!tag) {
      throw new Error(`Tag con ID ${id} no encontrado`);
    }

    await this.tagRepository.delete(id);
  }
}
