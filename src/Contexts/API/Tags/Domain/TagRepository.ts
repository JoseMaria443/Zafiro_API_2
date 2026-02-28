import { Tag } from './Tag.js';

export interface ITagRepository {
  save(tag: Tag): Promise<void>;

  findById(id: number): Promise<Tag | null>;

  findByUserId(idUsuario: number): Promise<Tag[]>;

  findByUserIdAndName(idUsuario: number, nombre: string): Promise<Tag | null>;

  update(tag: Tag): Promise<void>;

  delete(id: number): Promise<void>;
}
