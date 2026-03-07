import type { Request, Response, NextFunction } from 'express';
import { JwtTokenGenerator } from '../Security/JwtTokenGenerator.js';

export class AuthMiddleware {
  private jwtGenerator = new JwtTokenGenerator();

  authenticate(req: Request, res: Response, next: NextFunction): void {
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

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
      });
      return;
    }

    // Agregar información del usuario al request
    (req as any).user = payload;

    next();
  }
}
