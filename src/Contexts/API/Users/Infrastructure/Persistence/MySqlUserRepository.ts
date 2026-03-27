import { User } from '../../Domain/User.js';
import type { IUserRepository } from '../../Domain/UserRepository.js';
import { PostgresConnection } from '../../../../../Shared/Infrastructure/Database/PostgresConnection.js';

export interface GoogleConnectionData {
  googleEmail?: string;
  googleAccountSub?: string;
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: Date;
}

export interface GoogleConnectionRecord {
  idUsuario: string;
  googleEmail?: string;
  googleAccountSub?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface GoogleSyncStateRecord {
  idUsuario: string;
  googleCalendarId: string;
  syncToken?: string;
  lastSyncedAt?: Date;
  lastSuccessfulSyncAt?: Date;
  lastError?: string;
}

export interface GoogleReminderSettings {
  useDefault: boolean;
  overrides?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
}

export class MySqlUserRepository implements IUserRepository {

    /**
     * Refresca el access token de Google usando el refresh_token y guarda todos los datos relevantes en la BD.
     * Devuelve el nuevo access token y los datos actualizados.
     */
    async refreshAndSaveGoogleConnection(connection: GoogleConnectionRecord): Promise<GoogleConnectionData> {
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

      const payload = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
        refresh_token?: string;
        token_type?: string;
        scope?: string;
        error?: string;
        error_description?: string;
      };

      if (!response.ok || !payload.access_token) {
        const rawMessage = payload.error_description || payload.error || 'No se pudo renovar token de Google';
        const normalized = rawMessage.toLowerCase();
        if (normalized.includes('invalid_grant') || normalized.includes('revoked') || normalized.includes('expired')) {
          throw new Error('La sesión de Google expiró o fue revocada. Reconecta tu cuenta de Google Calendar.');
        }
        throw new Error(rawMessage);
      }

      // Mantener los datos previos si Google no devuelve nuevos
      const newData: GoogleConnectionData = {
        googleEmail: connection.googleEmail,
        googleAccountSub: connection.googleAccountSub,
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token || connection.refreshToken,
        tokenType: payload.token_type || connection.tokenType,
        scope: payload.scope || connection.scope,
        expiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : connection.expiresAt,
      };

      await this.saveGoogleConnection(connection.idUsuario, newData);
      return newData;
    }
  private db = PostgresConnection.getInstance();

  async save(user: User): Promise<void> {
    try {
      console.log(' [DB] Intentando guardar usuario en BD...');
      console.log(`   → ID: ${user.id}`);
      console.log(`   → Clerk ID: ${user.clerkUserId}`);
      console.log(`   → Correo: ${user.correo}`);
      console.log(`   → Nombre: ${user.nombre}`);
      
      await this.db.query(
        `INSERT INTO usuarios (id, clerk_user_id, correo, nombre, token_google) 
        VALUES ($1, $2, $3, $4, $5)`,
        [user.id, user.clerkUserId, user.correo, user.nombre, user.tokenGoogle || null]
      );
      
      console.log('[DB] Usuario guardado exitosamente en la base de datos');
    } catch (error) {
      console.error('[DB] Error guardando usuario:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(
      row.id,
      row.clerk_user_id,
      row.correo,
      row.nombre,
      row.token_google
    );
  }

  async findByClerkUserId(clerkUserId: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM usuarios WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(
      row.id,
      row.clerk_user_id,
      row.correo,
      row.nombre,
      row.token_google
    );
  }

  async findByEmail(correo: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(
      row.id,
      row.clerk_user_id,
      row.correo,
      row.nombre,
      row.token_google
    );
  }

  async update(user: User): Promise<void> {
    await this.db.query(
      `UPDATE usuarios 
       SET clerk_user_id = $1, correo = $2, nombre = $3, token_google = $4, updated_at = NOW()
       WHERE id = $5`,
      [user.clerkUserId, user.correo, user.nombre, user.tokenGoogle || null, user.id]
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM usuarios WHERE id = $1', [id]);
  }

  async findOrCreateByClerkProfile(
    clerkUserId: string,
    correo: string,
    nombre: string,
  ): Promise<User> {
    const existing = await this.findByClerkUserId(clerkUserId);
    if (existing) {
      if (existing.correo !== correo || existing.nombre !== nombre) {
        const result = await this.db.query(
          `UPDATE usuarios
           SET correo = $1,
               nombre = $2,
               updated_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [correo, nombre || 'Usuario', existing.id]
        );

        if (result.rows.length > 0) {
          const row = result.rows[0];
          return new User(
            row.id,
            row.clerk_user_id,
            row.correo,
            row.nombre,
            row.token_google
          );
        }
      }

      return existing;
    }

    const result = await this.db.query(
      `INSERT INTO usuarios (clerk_user_id, correo, nombre)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [clerkUserId, correo, nombre || 'Usuario']
    );

    const row = result.rows[0];
    return new User(
      row.id,
      row.clerk_user_id,
      row.correo,
      row.nombre,
      row.token_google
    );
  }

  async saveGoogleConnection(idUsuario: string, data: GoogleConnectionData): Promise<void> {
    // Guardar en user_google_connections
    await this.db.query(
      `INSERT INTO user_google_connections (
         id_usuario,
         google_email,
         google_account_sub,
         access_token,
         refresh_token,
         token_type,
         scope,
         expires_at,
         is_active,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
       ON CONFLICT (id_usuario)
       DO UPDATE SET
         google_email = EXCLUDED.google_email,
         google_account_sub = EXCLUDED.google_account_sub,
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, user_google_connections.refresh_token),
         token_type = EXCLUDED.token_type,
         scope = EXCLUDED.scope,
         expires_at = EXCLUDED.expires_at,
         is_active = TRUE,
         updated_at = NOW()`,
      [
        idUsuario,
        data.googleEmail || null,
        data.googleAccountSub || null,
        data.accessToken,
        data.refreshToken || null,
        data.tokenType || null,
        data.scope || null,
        data.expiresAt || null,
      ]
    );

    // Forzar el guardado del token_google en usuarios si hay accessToken
    if (data.accessToken) {
      console.log(`[FORZAR TOKEN] Guardando token_google para usuario ${idUsuario}`);
      await this.db.query(
        `UPDATE usuarios
         SET token_google = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [data.accessToken, idUsuario]
      );
    } else {
      console.warn(`[FORZAR TOKEN] No se recibió accessToken para usuario ${idUsuario}, no se actualiza token_google`);
    }
  }

  async getGoogleConnectionByUserId(idUsuario: string): Promise<GoogleConnectionRecord | null> {
    const result = await this.db.query(
      `SELECT
         id_usuario,
         google_email,
         google_account_sub,
         access_token,
         refresh_token,
         token_type,
         scope,
         expires_at,
         is_active
       FROM user_google_connections
       WHERE id_usuario = $1 AND is_active = TRUE`,
      [idUsuario]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      idUsuario: row.id_usuario,
      googleEmail: row.google_email || undefined,
      googleAccountSub: row.google_account_sub || undefined,
      accessToken: row.access_token || undefined,
      refreshToken: row.refresh_token || undefined,
      tokenType: row.token_type || undefined,
      scope: row.scope || undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      isActive: Boolean(row.is_active),
    };
  }

  async upsertGoogleSyncState(
    idUsuario: string,
    googleCalendarId: string,
    syncToken?: string,
    lastError?: string
  ): Promise<void> {
    const isError = Boolean(lastError);
    await this.db.query(
      `INSERT INTO user_google_sync_state (
         id_usuario,
         google_calendar_id,
         sync_token,
         last_synced_at,
         last_successful_sync_at,
         last_error,
         updated_at
       ) VALUES (
         $1,
         $2,
         $3,
         NOW(),
         CASE WHEN $4::boolean THEN NULL ELSE NOW() END,
         $5,
         NOW()
       )
       ON CONFLICT (id_usuario)
       DO UPDATE SET
         google_calendar_id = EXCLUDED.google_calendar_id,
         sync_token = COALESCE(EXCLUDED.sync_token, user_google_sync_state.sync_token),
         last_synced_at = NOW(),
         last_successful_sync_at = CASE WHEN $4::boolean THEN user_google_sync_state.last_successful_sync_at ELSE NOW() END,
         last_error = EXCLUDED.last_error,
         updated_at = NOW()`,
      [idUsuario, googleCalendarId, syncToken || null, isError, lastError || null]
    );
  }

  async getGoogleSyncState(idUsuario: string): Promise<GoogleSyncStateRecord | null> {
    const result = await this.db.query(
      `SELECT
         id_usuario,
         google_calendar_id,
         sync_token,
         last_synced_at,
         last_successful_sync_at,
         last_error
       FROM user_google_sync_state
       WHERE id_usuario = $1`,
      [idUsuario]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      idUsuario: row.id_usuario,
      googleCalendarId: row.google_calendar_id,
      syncToken: row.sync_token || undefined,
      lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : undefined,
      lastSuccessfulSyncAt: row.last_successful_sync_at ? new Date(row.last_successful_sync_at) : undefined,
      lastError: row.last_error || undefined,
    };
  }

  async disconnectGoogle(idUsuario: string): Promise<void> {
    await this.db.query(
      `UPDATE user_google_connections
       SET is_active = FALSE,
           access_token = NULL,
           refresh_token = NULL,
           updated_at = NOW()
       WHERE id_usuario = $1`,
      [idUsuario]
    );

    await this.db.query(
      `UPDATE user_google_sync_state
       SET sync_token = NULL,
           last_error = NULL,
           updated_at = NOW()
       WHERE id_usuario = $1`,
      [idUsuario]
    );

    await this.db.query(
      `UPDATE usuarios
       SET token_google = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [idUsuario]
    );
  }

  async saveGoogleReminderSettings(
    idUsuario: string,
    reminders: GoogleReminderSettings
  ): Promise<void> {
    await this.db.query(
      `UPDATE usuarios
       SET google_reminders_use_default = $1,
           google_reminders_overrides = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [
        reminders.useDefault,
        reminders.overrides ? JSON.stringify(reminders.overrides) : null,
        idUsuario,
      ]
    );
  }
}
