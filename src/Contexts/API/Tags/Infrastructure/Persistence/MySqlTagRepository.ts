import { Tag } from '../../Domain/Tag.js';
import type { ITagRepository } from '../../Domain/TagRepository.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';

export class MySqlTagRepository implements ITagRepository {
  private db = PostgresConnection.getInstance();

  async save(tag: Tag): Promise<void> {
    await this.db.query(
      `INSERT INTO etiquetas (id, id_usuario, nombre, color, transparencia)
       VALUES ($1, $2, $3, $4, $5)`,
      [tag.id, tag.idUsuario, tag.nombre, tag.color, null]
    );
  }

  async findById(id: string): Promise<Tag | null> {
    const result = await this.db.query(
      'SELECT * FROM etiquetas WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new Tag(
      row.id.toString(),
      row.id_usuario,
      row.nombre,
      row.color
    );
  }

  async findByUserId(idUsuario: string): Promise<Tag[]> {
    const result = await this.db.query(
      'SELECT * FROM etiquetas WHERE id_usuario = $1 ORDER BY nombre',
      [idUsuario]
    );

    return result.rows.map((row: any) => new Tag(
      row.id.toString(),
      row.id_usuario,
      row.nombre,
      row.color
    ));
  }

  async findByUserIdAndName(idUsuario: string, nombre: string): Promise<Tag | null> {
    const result = await this.db.query(
      'SELECT * FROM etiquetas WHERE id_usuario = $1 AND nombre = $2',
      [idUsuario, nombre]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new Tag(
      row.id.toString(),
      row.id_usuario,
      row.nombre,
      row.color
    );
  }

  async update(tag: Tag): Promise<void> {
    await this.db.query(
      `UPDATE etiquetas 
       SET nombre = $1, color = $2
       WHERE id = $3`,
      [tag.nombre, tag.color, tag.id]
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query(
      'DELETE FROM etiquetas WHERE id = $1',
      [id]
    );
  }
}
