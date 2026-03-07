import type { Request, Response, NextFunction } from 'express';
import { JwtTokenGenerator } from '../Security/JwtTokenGenerator.js';
import { ClerkService } from '../Security/ClerkService.js';

export class AuthMiddleware {
  private jwtGenerator = new JwtTokenGenerator();
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
      ? authHeader.slice(7)
      : authHeader;

    const payload = this.jwtGenerator.verifyToken(token);

    if (payload) {
      (req as any).user = {
        ...payload,
        authType: 'jwt',
      };
      next();
      return;
    }

    try {
      const clerkUser = await this.clerkService.validateToken(token);
      (req as any).user = {
        id: undefined,
        correo: clerkUser.correo,
        nombre: clerkUser.nombre,
        clerkUserId: clerkUser.clerkUserId,
        authType: 'clerk',
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
