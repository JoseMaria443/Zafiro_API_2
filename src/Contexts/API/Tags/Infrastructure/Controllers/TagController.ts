import type { Request, Response } from 'express';
import { CreateTagUseCase } from '../../Application/CreateTag.js';
import { SearchTagsUseCase } from '../../Application/SearchTags.js';
import { UpdateTagUseCase } from '../../Application/UpdateTag.js';
import { DeleteTagUseCase } from '../../Application/DeleteTag.js';
import { Tag } from '../../Domain/Tag.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';

export class TagController {
  private db = PostgresConnection.getInstance();

  constructor(
    private createTagUseCase: CreateTagUseCase,
    private searchTagsUseCase: SearchTagsUseCase,
    private updateTagUseCase: UpdateTagUseCase,
    private deleteTagUseCase: DeleteTagUseCase
  ) {}

  private async resolveUserId(req: Request): Promise<string | null> {
    const authUser = (req as any).user as
      | { clerkUserId?: string }
      | undefined;

    if (!authUser?.clerkUserId) {
      return null;
    }

    const result = await this.db.query(
      'SELECT id FROM usuarios WHERE clerk_user_id = $1',
      [authUser.clerkUserId]
    );

    return result.rows[0]?.id ?? null;
  }

  private async resolveUserParamToInternalId(userIdParam: string): Promise<string | null> {
    if (!userIdParam || userIdParam.trim().length === 0) {
      return null;
    }

    if (userIdParam.startsWith('user_')) {
      const result = await this.db.query(
        'SELECT id FROM usuarios WHERE clerk_user_id = $1',
        [userIdParam]
      );
      return result.rows[0]?.id ?? null;
    }

    return userIdParam;
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      // Bloquear idUsuario en el body
      if (typeof (req.body as any).idUsuario !== 'undefined') {
        res.status(400).json({
          success: false,
          message: 'No se permite enviar idUsuario en el body. Se resuelve desde el token.',
        });
        return;
      }

      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const { nombre, color } = req.body as { nombre?: string; color?: string };

      const tag = await this.createTagUseCase.execute({
        idUsuario: resolvedUserId,
        nombre: nombre ?? '',
        color: color ?? '',
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
      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      // Verificar que el userId de la URL corresponde al usuario autenticado
      const userIdParam = req.params.userId;
      if (!userIdParam || typeof userIdParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }
      const requestedInternalUserId = await this.resolveUserParamToInternalId(userIdParam);
      if (!requestedInternalUserId || requestedInternalUserId !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para consultar etiquetas de otro usuario',
        });
        return;
      }

      const tags = await this.searchTagsUseCase.allTagsByUser(resolvedUserId);

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

  async getMyTags(req: Request, res: Response): Promise<void> {
    try {
      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const tags = await this.searchTagsUseCase.allTagsByUser(resolvedUserId);

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
      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const idParam = req.params.id;
      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      const tagId = Number.parseInt(idParam, 10);
      if (Number.isNaN(tagId) || tagId < 1) {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      const tag = await this.searchTagsUseCase.tagById(tagId);

      if (!tag) {
        res.status(404).json({
          success: false,
          message: 'Tag no encontrado',
        });
        return;
      }

      // Verificar que el tag pertenece al usuario autenticado
      if (tag.idUsuario !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para consultar esta etiqueta',
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
      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const idParam = req.params.id;
      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      const tagId = Number.parseInt(idParam, 10);
      if (Number.isNaN(tagId) || tagId < 1) {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      // Verificar que el tag existe y pertenece al usuario
      const existing = await this.searchTagsUseCase.tagById(tagId);
      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Tag no encontrado',
        });
        return;
      }

      if (existing.idUsuario !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para modificar esta etiqueta',
        });
        return;
      }

      const { nombre, color } = req.body;

      const updatedTag = await this.updateTagUseCase.execute({
        id: tagId,
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
      const resolvedUserId = await this.resolveUserId(req);
      if (!resolvedUserId) {
        res.status(401).json({
          success: false,
          message: 'No se pudo resolver el usuario autenticado',
        });
        return;
      }

      const idParam = req.params.id;
      if (!idParam || typeof idParam !== 'string') {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      const tagId = Number.parseInt(idParam, 10);
      if (Number.isNaN(tagId) || tagId < 1) {
        res.status(400).json({
          success: false,
          message: 'ID de tag inválido',
        });
        return;
      }

      // Verificar que el tag existe y pertenece al usuario
      const existing = await this.searchTagsUseCase.tagById(tagId);
      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Tag no encontrado',
        });
        return;
      }

      if (existing.idUsuario !== resolvedUserId) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para eliminar esta etiqueta',
        });
        return;
      }

      await this.deleteTagUseCase.execute(tagId);

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