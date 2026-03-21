import type { Request, Response, NextFunction } from 'express';
import { ClerkService } from '../Security/ClerkService.js';

export class AuthMiddleware {

  private clerkService = new ClerkService();
  private bypassWarningShown = false;

  private isTruthy(value?: string): boolean {
    if (!value) {
      return false;
    }

    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  }

  private shouldBypassAuth(): boolean {
    const bypassEnabled = this.isTruthy(process.env.AUTH_BYPASS_ENABLED);
    const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';

    return bypassEnabled && !isProduction;
  }

  private readStringHeader(value: string | string[] | undefined): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const first = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
      return typeof first === 'string' ? first.trim() : undefined;
    }

    return undefined;
  }

  private buildBypassUser(req: Request): { clerkUserId: string; correo: string; nombre: string } {
    const clerkUserId =
      this.readStringHeader(req.headers['x-test-clerk-user-id']) ||
      process.env.AUTH_BYPASS_CLERK_USER_ID ||
      process.env.TEST_CLERK_USER_ID ||
      'test-clerk-user-id';

    const correo =
      this.readStringHeader(req.headers['x-test-user-email']) ||
      process.env.AUTH_BYPASS_EMAIL ||
      'test@local.dev';

    const nombre =
      this.readStringHeader(req.headers['x-test-user-name']) ||
      process.env.AUTH_BYPASS_NAME ||
      'Usuario de prueba';

    return {
      clerkUserId,
      correo,
      nombre,
    };
  }

  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (this.shouldBypassAuth()) {
      if (!this.bypassWarningShown) {
        console.warn('⚠️ [AUTH] AUTH_BYPASS_ENABLED activo (solo desarrollo/pruebas).');
        this.bypassWarningShown = true;
      }

      (req as any).user = this.buildBypassUser(req);
      next();
      return;
    }

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
