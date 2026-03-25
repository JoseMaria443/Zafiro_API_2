import type { Request, Response, NextFunction } from 'express';
import { ClerkService } from '../Security/ClerkService.js';

export class AuthMiddleware {
  
  private clerkService = new ClerkService();

  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = (req.body && typeof req.body.token === 'string') ? req.body.token.trim() : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token JWT no proporcionado en el body',
      });
      return;
    }

    try {
      const clerkUser = await this.clerkService.validateToken(token);
      (req as any).user = {
        clerkUserId: clerkUser.clerkUserId,
        correo: clerkUser.correo,
        nombre: clerkUser.nombre,
      };
      next();
    } catch {
      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
      });
    }
  }
}
