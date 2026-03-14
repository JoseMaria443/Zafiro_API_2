import type { Request, Response, NextFunction } from 'express';
import { ClerkService } from '../Security/ClerkService.js';

export class AuthMiddleware {
  private clerkService = new ClerkService();

  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token vacío',
      });
      return;
    }

    try {
      const clerkUser = await this.clerkService.validateToken(token);
      (req as any).user = {
        id: undefined,
        correo: clerkUser.correo,
        nombre: clerkUser.nombre,
        clerkUserId: clerkUser.clerkUserId,
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
