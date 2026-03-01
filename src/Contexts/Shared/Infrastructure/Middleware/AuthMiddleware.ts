import type { Request, Response, NextFunction } from 'express';
import { JwtTokenGenerator, type TokenPayload } from '../Security/JwtTokenGenerator.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export class AuthMiddleware {
  private jwtGenerator = new JwtTokenGenerator();

  authenticate(req: Request, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Token no proporcionado',
        });
        return;
      }

      const token = authHeader.substring(7); // Eliminar "Bearer "
      const payload = this.jwtGenerator.verifyToken(token);

      if (!payload) {
        res.status(401).json({
          success: false,
          message: 'Token inválido o expirado',
        });
        return;
      }

      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Error de autenticación',
      });
    }
  }
}
