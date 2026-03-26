import type { Request, Response, NextFunction } from 'express';
import { ClerkService } from '../Security/ClerkService.js';

export class AuthMiddleware {
  
  private clerkService = new ClerkService();

  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Obtener el token del header Authorization (Bearer)
    const authHeader = req.headers.authorization;
    let token: string | null = null;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token JWT no proporcionado en el header Authorization',
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
