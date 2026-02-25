import type { Request, Response } from 'express';
import { CreateTagUseCase } from '../../Application/CreateTag.js';
import { SearchTagsUseCase } from '../../Application/SearchTags.js';
import { UpdateTagUseCase } from '../../Application/UpdateTag.js';
import { DeleteTagUseCase } from '../../Application/DeleteTag.js';
import { Tag } from '../../Domain/Tag.js';

export class TagController {
  constructor(
    private createTagUseCase: CreateTagUseCase,
    private searchTagsUseCase: SearchTagsUseCase,
    private updateTagUseCase: UpdateTagUseCase,
    private deleteTagUseCase: DeleteTagUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { id, idUsuario, nombre, color } = req.body;

      const tag = await this.createTagUseCase.execute({
        id,
        idUsuario,
        nombre,
        color,
      });

      res.status(201).json({
        success: true,
        message: 'Tag creado correctamente',
        data: {
          id: tag.id,
          idUsuario: tag.idUsuario,
          nombre: tag.nombre,
          color: tag.color,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getUserTags(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.userId;

      if (!userIdParam || typeof userIdParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const idUsuario = parseInt(userIdParam);

      const tags = await this.searchTagsUseCase.allTagsByUser(idUsuario);

      res.status(200).json({
        success: true,
        data: tags.map((tag: Tag) => ({
          id: tag.id,
          nombre: tag.nombre,
          color: tag.color,
        })),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getTagById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      const tag = await this.searchTagsUseCase.tagById(idParam);

      if (!tag) {
        res.status(404).json({
          success: false,
          message: 'Tag no encontrado',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: tag.id,
          idUsuario: tag.idUsuario,
          nombre: tag.nombre,
          color: tag.color,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      const { nombre, color } = req.body;

      const updatedTag = await this.updateTagUseCase.execute({
        id: idParam,
        nombre,
        color,
      });

      res.status(200).json({
        success: true,
        message: 'Tag actualizado correctamente',
        data: {
          id: updatedTag.id,
          idUsuario: updatedTag.idUsuario,
          nombre: updatedTag.nombre,
          color: updatedTag.color,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id;

      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      await this.deleteTagUseCase.execute(idParam);

      res.status(200).json({
        success: true,
        message: 'Tag eliminado correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
