import { Tag } from './Tag.js';

export interface ITagRepository {
  save(tag: Tag): Promise<Tag>;

  findById(id: number): Promise<Tag | null>;

  findByUserId(idUsuario: string): Promise<Tag[]>;

  findByUserIdAndName(idUsuario: string, nombre: string): Promise<Tag | null>;

  update(tag: Tag): Promise<void>;

  delete(id: number): Promise<void>;
}
