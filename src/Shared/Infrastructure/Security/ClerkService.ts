import { verifyToken } from '@clerk/backend';

export interface ClerkUserInfo {
  clerkUserId: string;
  correo: string;
  nombre: string;
}

export class ClerkService {
  private clerkSecretKey = process.env.CLERK_SECRET_KEY || '';

  /**
   * Valida un token de Clerk y extrae la información del usuario
   * @param token Token JWT de Clerk
   * @returns Información del usuario de Clerk
   */
  async validateToken(token: string): Promise<ClerkUserInfo> {
    interface ClerkTokenPayload {
      sub: string;
      email: string;
      name: string;
      [key: string]: any;
    }
    if (!this.clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY no está configurada en variables de entorno');
    }

    if (!token) {
      throw new Error('Token de Clerk requerido');
    }

    try {
      // Remover "Bearer " del token si existe
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

      // Verificar y decodificar el token de Clerk
      const decoded = (await verifyToken(cleanToken, {
        secretKey: this.clerkSecretKey,
      })) as unknown as ClerkTokenPayload;

      // Extraer información del usuario del token
      const clerkUserId = decoded.sub; // ID del usuario de Clerk
      const correo = decoded.email || '';
      const nombre = decoded.name || '';

      if (!clerkUserId) {
        throw new Error('Token de Clerk inválido: sub no encontrado');
      }

      if (!correo) {
        throw new Error('Token de Clerk inválido: email no encontrado');
      }

      return {
        clerkUserId,
        correo,
        nombre,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error validando token de Clerk: ${error.message}`);
      }
      throw new Error('Error desconocido validando token de Clerk');
    }
  }

  /**
   * Verifica si Clerk Service está correctamente configurado
   */
  isConfigured(): boolean {
    return !!this.clerkSecretKey;
  }
}
