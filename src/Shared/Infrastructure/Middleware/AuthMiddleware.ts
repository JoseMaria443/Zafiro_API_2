import type { Request, Response, NextFunction } from 'express';
import { ClerkService } from '../Security/ClerkService.js';

export class AuthMiddleware {
  
  private clerkService = new ClerkService();

  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Permitir token en header Authorization (Bearer) o en el body (token)
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.body && typeof req.body.token === 'string') {
      token = req.body.token.trim();
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token JWT no proporcionado en el header Authorization ni en el body',
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
