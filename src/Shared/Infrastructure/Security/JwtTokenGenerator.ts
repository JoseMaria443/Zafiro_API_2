import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

export interface TokenPayload extends JwtPayload {
  id: string; // UUID string
  correo: string;
  nombre: string;
  clerkUserId: string;
}

export class JwtTokenGenerator {
  private secret: string;

  constructor(secret: string = process.env.JWT_SECRET || 'tu-clave-secreta-muy-segura') {
    this.secret = secret;
  }

  generateToken(payload: TokenPayload, expiresIn: string = '24h'): string {
    return jwt.sign(payload, this.secret, { expiresIn } as any);
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}
