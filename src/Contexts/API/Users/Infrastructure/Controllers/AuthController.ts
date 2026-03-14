import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { LoginUserUseCase } from '../../Application/LoginUser.js';
import { GetUserUseCase } from '../../Application/GetUser.js';
import { UpdateUserUseCase } from '../../Application/UpdateUser.js';
import { DeleteUserUseCase } from '../../Application/DeleteUser.js';
import { User } from '../../Domain/User.js';
import { MySqlUserRepository } from '../Persistence/MySqlUserRepository.js';
import type {
  GoogleConnectionData,
  GoogleConnectionRecord,
} from '../Persistence/MySqlUserRepository.js';
import { MySqlActivityRepository } from '../../../Activities/Infrastructure/Persistence/MySqlActivityRepository.js';
import type { EventDateTime } from '../../../Activities/Domain/Activity.js';

interface StatePayload {
  userId: string;
  clerkUserId: string;
  issuedAt: number;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
}

interface GoogleCalendarEvent {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  organizer?: {
    email?: string;
  };
  start?: EventDateTime;
  end?: EventDateTime;
  created?: string;
  updated?: string;
}

interface GoogleCalendarListResponse {
  items?: GoogleCalendarEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
  error?: {
    code?: number;
    message?: string;
  };
}

export class AuthController {
  private readonly userRepository = new MySqlUserRepository();
  private readonly activityRepository = new MySqlActivityRepository();

  constructor(
    private loginUserUseCase: LoginUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase
  ) {}

  /**
   * Registro con Clerk (actualmente no se usa, crear usuarios en Clerk primero)
   * Mantenido para compatibilidad backward
   */
  async register(req: Request, res: Response): Promise<void> {
    res.status(410).json({
      success: false,
      message: 'El registro legacy no está soportado. Usa Clerk para autenticación.',
    });
  }

  /**
   * Login con Clerk token
   * Valida el token con Clerk y crea/busca el usuario
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log(' [AUTH] Intentando login...');
      const { clerkToken } = req.body as { clerkToken?: string };

      if (!clerkToken || typeof clerkToken !== 'string') {
        console.log(' [AUTH] clerkToken no proporcionado o inválido');
        res.status(400).json({
          success: false,
          message: 'clerkToken requerido en el body',
        });
        return;
      }

      console.log('[AUTH] Token recibido, validando con Clerk...');
      const { user, isNewUser } = await this.loginUserUseCase.execute(clerkToken);

      console.log(`[AUTH] Login exitoso - Usuario: ${user.correo} (${isNewUser ? 'NUEVO' : 'EXISTENTE'})`);
      console.log(`   → ID: ${user.id}`);
      console.log(`   → Clerk ID: ${user.clerkUserId}`);
      
      res.status(200).json({
        success: true,
        message: isNewUser ? 'Usuario creado y sesión iniciada' : 'Sesión iniciada correctamente',
        data: {
          id: user.id,
          clerkUserId: user.clerkUserId,
          correo: user.correo,
          nombre: user.nombre,
          isNewUser,
        },
      });
    } catch (error) {
      console.error('[AUTH] Error en login:', error instanceof Error ? error.message : error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Login de sesión usando Authorization: Bearer <ClerkToken>
   * Ideal para sincronizar usuario en BD tras autenticación en frontend.
   */
  async loginSession(req: Request, res: Response): Promise<void> {
    try {
      const tokenFromHeader = this.extractBearerToken(req.headers.authorization);
      if (!tokenFromHeader) {
        res.status(400).json({
          success: false,
          message: 'Authorization Bearer token requerido',
        });
        return;
      }

      const { user, isNewUser } = await this.loginUserUseCase.execute(tokenFromHeader);

      res.status(200).json({
        success: true,
        message: isNewUser ? 'Usuario creado y sesión iniciada' : 'Sesión iniciada correctamente',
        data: {
          id: user.id,
          clerkUserId: user.clerkUserId,
          correo: user.correo,
          nombre: user.nombre,
          isNewUser,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Registro de sesión usando Authorization: Bearer <ClerkToken>
   * Se utiliza justo después de crear cuenta en Clerk desde el frontend.
   */
  async registerSession(req: Request, res: Response): Promise<void> {
    try {
      const tokenFromHeader = this.extractBearerToken(req.headers.authorization);
      if (!tokenFromHeader) {
        res.status(400).json({
          success: false,
          message: 'Authorization Bearer token requerido',
        });
        return;
      }

      const { user, isNewUser } = await this.loginUserUseCase.execute(tokenFromHeader);

      if (!isNewUser) {
        res.status(409).json({
          success: false,
          message: 'La cuenta ya existe en la base de datos',
          data: {
            id: user.id,
            clerkUserId: user.clerkUserId,
            correo: user.correo,
            nombre: user.nombre,
            isNewUser,
          },
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Cuenta creada y sesión iniciada correctamente',
        data: {
          id: user.id,
          clerkUserId: user.clerkUserId,
          correo: user.correo,
          nombre: user.nombre,
          isNewUser,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Obtener perfil del usuario (por UUID)
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;

      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const user = await this.getUserUseCase.execute(idParam);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          clerkUserId: user.clerkUserId,
          correo: user.correo,
          nombre: user.nombre,
        },
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Actualizar usuario (por UUID)
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;

      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      const { nombre } = req.body as { nombre?: string };

      const updatedUser = await this.updateUserUseCase.execute({
        id: idParam,
        nombre,
      });

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: {
          id: updatedUser.id,
          clerkUserId: updatedUser.clerkUserId,
          correo: updatedUser.correo,
          nombre: updatedUser.nombre,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Eliminar usuario (por UUID)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id as string;

      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
        return;
      }

      await this.deleteUserUseCase.execute(idParam);

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async googleConnect(req: Request, res: Response): Promise<void> {
    try {
      this.validateGoogleOAuthEnv();
      const user = await this.resolveAuthenticatedUser(req);
      const state = this.signState({
        userId: user.id,
        clerkUserId: user.clerkUserId,
        issuedAt: Date.now(),
      });

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
      authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI || '');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('include_granted_scopes', 'true');
      authUrl.searchParams.set('scope', this.getGoogleScopes());
      authUrl.searchParams.set('state', state);

      res.status(200).json({
        success: true,
        data: {
          url: authUrl.toString(),
          userId: user.id,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo iniciar Google OAuth',
      });
    }
  }

  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      this.validateGoogleOAuthEnv();

      const code = req.query.code;
      const state = req.query.state;
      if (typeof code !== 'string' || typeof state !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Parámetros code/state inválidos en callback',
        });
        return;
      }

      const statePayload = this.verifyState(state);
      if (!statePayload) {
        res.status(400).json({
          success: false,
          message: 'state inválido o expirado',
        });
        return;
      }

      const user = await this.userRepository.findById(statePayload.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado para completar la conexión',
        });
        return;
      }

      if (user.clerkUserId !== statePayload.clerkUserId) {
        res.status(400).json({
          success: false,
          message: 'state no coincide con el usuario autenticado',
        });
        return;
      }

      const tokenData = await this.exchangeGoogleCode(code);
      const googleUser = await this.getGoogleUserInfo(tokenData.access_token);
      const expiresAt = this.computeExpiresAt(tokenData.expires_in);

      await this.userRepository.saveGoogleConnection(user.id, {
        googleEmail: googleUser.email,
        googleAccountSub: googleUser.sub,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        expiresAt,
      });

      const syncResult = await this.syncGoogleCalendarForUser(user.id, true);

      res.status(200).json({
        success: true,
        message: 'Google Calendar conectado y sincronizado',
        data: {
          userId: user.id,
          imported: syncResult.imported,
          nextSyncToken: syncResult.nextSyncToken,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo completar el callback',
      });
    }
  }

  async googleSync(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.resolveAuthenticatedUser(req);
      const forceFullSync = Boolean((req.body as { forceFullSync?: boolean })?.forceFullSync);
      const result = await this.syncGoogleCalendarForUser(user.id, forceFullSync);

      res.status(200).json({
        success: true,
        message: 'Sincronización completada',
        data: {
          imported: result.imported,
          nextSyncToken: result.nextSyncToken,
          lastSyncAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo sincronizar Google Calendar',
      });
    }
  }

  async googleStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.resolveAuthenticatedUser(req);
      const connection = await this.userRepository.getGoogleConnectionByUserId(user.id);
      const syncState = await this.userRepository.getGoogleSyncState(user.id);

      res.status(200).json({
        success: true,
        data: {
          connected: Boolean(connection && connection.isActive),
          userId: user.id,
          googleEmail: connection?.googleEmail,
          expiresAt: connection?.expiresAt,
          sync: syncState
            ? {
                calendarId: syncState.googleCalendarId,
                lastSyncedAt: syncState.lastSyncedAt,
                lastSuccessfulSyncAt: syncState.lastSuccessfulSyncAt,
                lastError: syncState.lastError,
              }
            : null,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo consultar el estado',
      });
    }
  }

  async googleEvents(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.resolveAuthenticatedUser(req);
      const connection = await this.userRepository.getGoogleConnectionByUserId(user.id);

      if (!connection || !connection.isActive) {
        res.status(400).json({
          success: false,
          message: 'El usuario no tiene una conexión Google activa',
        });
        return;
      }

      const accessToken = await this.getValidAccessToken(user.id, connection);
      const calendarId = typeof req.query.calendarId === 'string' ? req.query.calendarId : 'primary';

      const params = new URLSearchParams();
      params.set('singleEvents', typeof req.query.singleEvents === 'string' ? req.query.singleEvents : 'true');
      params.set('showDeleted', typeof req.query.showDeleted === 'string' ? req.query.showDeleted : 'false');
      params.set('maxResults', typeof req.query.maxResults === 'string' ? req.query.maxResults : '500');

      if (typeof req.query.timeMin === 'string') {
        params.set('timeMin', req.query.timeMin);
      }

      if (typeof req.query.timeMax === 'string') {
        params.set('timeMax', req.query.timeMax);
      }

      if (typeof req.query.pageToken === 'string') {
        params.set('pageToken', req.query.pageToken);
      }

      if (typeof req.query.orderBy === 'string') {
        params.set('orderBy', req.query.orderBy);
      }

      const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as GoogleCalendarListResponse;

      if (!response.ok) {
        throw new Error(payload.error?.message || 'No se pudo consultar Google Calendar');
      }

      res.status(200).json({
        success: true,
        data: {
          items: payload.items || [],
          nextPageToken: payload.nextPageToken,
          nextSyncToken: payload.nextSyncToken,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo consultar eventos de Google Calendar',
      });
    }
  }

  async googleDisconnect(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.resolveAuthenticatedUser(req);
      await this.userRepository.disconnectGoogle(user.id);

      res.status(200).json({
        success: true,
        message: 'Google Calendar desconectado correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo desconectar Google Calendar',
      });
    }
  }

  private async resolveAuthenticatedUser(req: Request): Promise<User> {
    const requestUser = (req as any).user as
      | {
          id?: string;
          correo?: string;
          nombre?: string;
          clerkUserId?: string;
        }
      | undefined;

    if (!requestUser) {
      throw new Error('Usuario no autenticado');
    }

    if (requestUser.id) {
      const userById = await this.userRepository.findById(requestUser.id);
      if (userById) {
        return userById;
      }
    }

    if (!requestUser.clerkUserId || !requestUser.correo) {
      throw new Error('Token sin datos mínimos de usuario');
    }

    return await this.userRepository.findOrCreateByClerkProfile(
      requestUser.clerkUserId,
      requestUser.correo,
      requestUser.nombre || 'Usuario'
    );
  }

  private extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || authHeader.trim().length === 0) {
      return null;
    }

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      return token.length > 0 ? token : null;
    }

    const token = authHeader.trim();
    return token.length > 0 ? token : null;
  }

  private validateGoogleOAuthEnv(): void {
    const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];
    const missing = required.filter((key) => !process.env[key] || process.env[key]?.trim().length === 0);

    if (missing.length > 0) {
      throw new Error(`Faltan variables de entorno de Google OAuth: ${missing.join(', ')}`);
    }
  }

  private getGoogleScopes(): string {
    const configured = process.env.GOOGLE_CALENDAR_SCOPES;
    if (configured && configured.trim().length > 0) {
      return configured;
    }

    return [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.readonly',
    ].join(' ');
  }

  private getStateSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY;
    if (!secret || secret.trim().length === 0) {
      throw new Error('Falta JWT_SECRET o CLERK_SECRET_KEY para firmar state de Google OAuth');
    }

    return secret;
  }

  private signState(payload: StatePayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.getStateSecret()).update(body).digest('base64url');
    return `${body}.${signature}`;
  }

  private verifyState(state: string): StatePayload | null {
    const [body, signature] = state.split('.');
    if (!body || !signature) {
      return null;
    }

    const expected = createHmac('sha256', this.getStateSecret()).update(body).digest('base64url');
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StatePayload;
    const maxAgeMs = 10 * 60 * 1000;
    if (!payload.issuedAt || Date.now() - payload.issuedAt > maxAgeMs) {
      return null;
    }

    return payload;
  }

  private computeExpiresAt(expiresIn?: number): Date | undefined {
    if (!expiresIn || Number.isNaN(expiresIn)) {
      return undefined;
    }

    return new Date(Date.now() + expiresIn * 1000);
  }

  private async exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const payload = (await response.json()) as GoogleTokenResponse & { error?: string; error_description?: string };
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || 'No se pudo obtener token de Google');
    }

    return payload;
  }

  private async refreshGoogleToken(connection: GoogleConnectionRecord): Promise<GoogleConnectionData> {
    if (!connection.refreshToken) {
      throw new Error('La conexión Google no tiene refresh_token para renovar acceso');
    }

    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: connection.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const payload = (await response.json()) as GoogleTokenResponse & { error?: string; error_description?: string };
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || 'No se pudo renovar token de Google');
    }

    return {
      googleEmail: connection.googleEmail,
      googleAccountSub: connection.googleAccountSub,
      accessToken: payload.access_token,
      refreshToken: connection.refreshToken,
      tokenType: payload.token_type || connection.tokenType,
      scope: payload.scope || connection.scope,
      expiresAt: this.computeExpiresAt(payload.expires_in),
    };
  }

  private async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {};
    }

    return (await response.json()) as GoogleUserInfo;
  }

  private async getValidAccessToken(idUsuario: string, connection: GoogleConnectionRecord): Promise<string> {
    const isExpired =
      connection.expiresAt instanceof Date &&
      !Number.isNaN(connection.expiresAt.getTime()) &&
      connection.expiresAt.getTime() - Date.now() < 60_000;

    if (!isExpired && connection.accessToken) {
      return connection.accessToken;
    }

    const refreshed = await this.refreshGoogleToken(connection);
    await this.userRepository.saveGoogleConnection(idUsuario, refreshed);
    return refreshed.accessToken;
  }

  private getSyncWindow(): { timeMin: string; timeMax: string } {
    const back = Number.parseInt(process.env.GOOGLE_SYNC_DEFAULT_DAYS_BACK || '30', 10);
    const forward = Number.parseInt(process.env.GOOGLE_SYNC_DEFAULT_DAYS_FORWARD || '180', 10);
    const now = new Date();

    const minDate = new Date(now);
    minDate.setUTCDate(minDate.getUTCDate() - (Number.isNaN(back) ? 30 : back));

    const maxDate = new Date(now);
    maxDate.setUTCDate(maxDate.getUTCDate() + (Number.isNaN(forward) ? 180 : forward));

    return {
      timeMin: minDate.toISOString(),
      timeMax: maxDate.toISOString(),
    };
  }

  private async syncGoogleCalendarForUser(
    idUsuario: string,
    forceFullSync: boolean
  ): Promise<{ imported: number; nextSyncToken?: string }> {
    this.validateGoogleOAuthEnv();

    const connection = await this.userRepository.getGoogleConnectionByUserId(idUsuario);
    if (!connection || !connection.isActive) {
      throw new Error('El usuario no tiene una conexión Google activa');
    }

    const accessToken = await this.getValidAccessToken(idUsuario, connection);
    const previousSyncState = await this.userRepository.getGoogleSyncState(idUsuario);
    const calendarId = previousSyncState?.googleCalendarId || 'primary';

    let nextPageToken: string | undefined;
    let nextSyncToken: string | undefined;
    let imported = 0;

    try {
      do {
        const params = new URLSearchParams({
          singleEvents: 'true',
          showDeleted: 'true',
          maxResults: '2500',
        });

        if (nextPageToken) {
          params.set('pageToken', nextPageToken);
        }

        if (!forceFullSync && previousSyncState?.syncToken) {
          params.set('syncToken', previousSyncState.syncToken);
        } else {
          const { timeMin, timeMax } = this.getSyncWindow();
          params.set('timeMin', timeMin);
          params.set('timeMax', timeMax);
          params.set('orderBy', 'startTime');
        }

        const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const payload = (await response.json()) as GoogleCalendarListResponse;

        if (!response.ok) {
          const isExpiredSyncToken = response.status === 410;
          if (isExpiredSyncToken && !forceFullSync) {
            return await this.syncGoogleCalendarForUser(idUsuario, true);
          }

          throw new Error(payload.error?.message || 'Error consultando eventos de Google Calendar');
        }

        for (const item of payload.items || []) {
          if (!item.id) {
            continue;
          }

          await this.activityRepository.upsertGoogleEvent(idUsuario, {
            id: item.id,
            calendarId,
            status: item.status,
            summary: item.summary,
            description: item.description,
            location: item.location,
            htmlLink: item.htmlLink,
            organizerEmail: item.organizer?.email,
            start: item.start,
            end: item.end,
            created: item.created,
            updated: item.updated,
            rawPayload: item,
          });
          imported += 1;
        }

        nextPageToken = payload.nextPageToken;
        if (payload.nextSyncToken) {
          nextSyncToken = payload.nextSyncToken;
        }
      } while (nextPageToken);

      await this.userRepository.upsertGoogleSyncState(idUsuario, calendarId, nextSyncToken, undefined);

      return {
        imported,
        nextSyncToken,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido durante sincronización';
      await this.userRepository.upsertGoogleSyncState(
        idUsuario,
        calendarId,
        previousSyncState?.syncToken,
        message
      );
      throw error;
    }
  }
}
