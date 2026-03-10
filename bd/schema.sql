-- Habilita funciones criptograficas y utilidades como gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Limpia tablas auxiliares de integracion Google primero por dependencias.
DROP TABLE IF EXISTS user_google_sync_state CASCADE;
DROP TABLE IF EXISTS user_google_connections CASCADE;
-- Limpia tablas del dominio principal de actividades.
DROP TABLE IF EXISTS prioridad CASCADE;
DROP TABLE IF EXISTS repeticiones CASCADE;
DROP TABLE IF EXISTS actividades_detalles CASCADE;
DROP TABLE IF EXISTS actividades CASCADE;
DROP TABLE IF EXISTS etiquetas CASCADE;
DROP TABLE IF EXISTS ajustes_usuario CASCADE;
DROP TABLE IF EXISTS frecuencia CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
-- Limpia tipos enumerados para recrearlos de forma consistente.
DROP TYPE IF EXISTS frecuencia_enum;
DROP TYPE IF EXISTS activity_source_enum;
DROP TYPE IF EXISTS activity_status_enum;
DROP TYPE IF EXISTS priority_value_enum;

-- Frecuencia funcional para actividades repetitivas (RF-03).
CREATE TYPE frecuencia_enum AS ENUM ('diaria', 'semanal', 'mensual');
-- Valores de prioridad para actividades (RF-03).
CREATE TYPE priority_value_enum AS ENUM ('baja', 'media', 'alta');

-- Usuarios del sistema: se registran/sincronizan al hacer login con Clerk.
-- FLUJO: Login con Clerk -> obtener clerk_user_id, correo y nombre desde Clerk -> guardar en tabla usuarios.
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ID externo y unico de Clerk (obtenido durante login).
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    -- Correo obtenido del login Clerk (no editable desde UI del app).
    correo VARCHAR(255) UNIQUE,
    -- Contrasenna almacenada de forma segura (no usado en login Clerk, solo para compatibilidad legacy).
    contrasenna VARCHAR(255),
    -- Nombre obtenido del login Clerk (no editable desde UI del app).
    nombre VARCHAR(255),
    -- Token de acceso a Google Calendar (se genera durante vinculacion OAuth).
    token_google VARCHAR(2048),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Etiquetas visuales para organizar actividades por usuario.
CREATE TABLE etiquetas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario UUID NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    transparencia VARCHAR(15),
    color VARCHAR(7),
    CONSTRAINT fk_etiquetas_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla principal de actividades (locales y sincronizadas desde Google).
CREATE TABLE actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    id_etiqueta INTEGER,
    
    -- ID del evento en Google Calendar (para sincronizacion)
    google_event_id VARCHAR(255),
    google_calendar_id VARCHAR(255) DEFAULT 'primary',
    
    -- Campos principales del evento (compatibles con Google Calendar)
    summary VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    
    -- Fechas de inicio y fin (Google Calendar format)
    -- Para eventos con hora especifica usa start_datetime
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    start_timezone VARCHAR(100),
    end_timezone VARCHAR(100),
    
    -- Para eventos de todo el dia usa start_date
    start_date DATE,
    end_date DATE,
    
    -- Metadatos del evento
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    event_created TIMESTAMPTZ,
    event_updated TIMESTAMPTZ,
    
    -- Campos adicionales de Google Calendar
    transparency VARCHAR(20),
    event_type VARCHAR(50),
    recurring_event_id VARCHAR(255),
    
    -- RF-03: tiempo de descanso y tiempo muerto (traslados, etc.)
    tiempo_descanso_min INTEGER DEFAULT 0,
    tiempo_muerto_min INTEGER DEFAULT 0,
    
    -- Source y sync
    source VARCHAR(20) DEFAULT 'local',
    last_synced_at TIMESTAMPTZ,
    
    CONSTRAINT fk_actividades_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_actividades_etiqueta
        FOREIGN KEY (id_etiqueta) REFERENCES etiquetas(id) ON DELETE SET NULL,
    CONSTRAINT uq_actividades_google_event
        UNIQUE (id_usuario, google_calendar_id, google_event_id)
);

-- Indices para acelerar consultas
CREATE INDEX idx_actividades_usuario ON actividades(id_usuario);
CREATE INDEX idx_actividades_usuario_start ON actividades(id_usuario, start_datetime);
CREATE INDEX idx_actividades_usuario_date ON actividades(id_usuario, start_date);
CREATE INDEX idx_actividades_google_event ON actividades(id_usuario, google_event_id);
CREATE INDEX idx_actividades_created ON actividades(created_at);
CREATE INDEX idx_actividades_status ON actividades(status);

-- Prioridad asignada a cada actividad.
CREATE TABLE prioridad (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_actividad UUID NOT NULL,
    valor priority_value_enum NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_prioridad_actividad
        FOREIGN KEY (id_actividad) REFERENCES actividades(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_prioridad_id_actividad
    ON prioridad(id_actividad);

-- Detalles descriptivos de cada actividad.
CREATE TABLE actividades_detalles (
    description TEXT,
    location VARCHAR(500),
    html_link TEXT,
    ical_uid VARCHAR(255),
    organizer_email VARCHAR(255),
    organizer_display_name VARCHAR(255),
    creator_email VARCHAR(255),
    creator_display_name VARCHAR(255),
    -- Recurrence rules (RFC5545)
    recurrence TEXT[],
    -- Reminders
    reminders_use_default BOOLEAN DEFAULT true,
    reminders_overrides JSONB,
    -- Payload original opcional para auditoria/depuracion
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_actividades_detalles_actividad
        FOREIGN KEY (id_actividad) REFERENCES actividades(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_actividades_detalles_id_actividad
    ON actividades_detalles(id_actividad    CONSTRAINT fk_actividades_detalles_actividad
        FOREIGN KEY (id_actividad) REFERENCES actividades(id) ON DELETE CASCADE
);

-- Catalogo de frecuencias permitidas para repeticion.
CREATE TABLE frecuencia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    frecuencia frecuencia_enum NOT NULL
);

-- Configuracion de repeticion por actividad.
CREATE TABLE repeticiones (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_frecuencia INTEGER,
    -- Ejemplo: MON,TUE,FRI cuando aplica frecuencia semanal.
    dias_semana VARCHAR(25),
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    id_actividad UUID NOT NULL,
    -- Regla RFC5545 (RRULE) para compatibilidad con Google Calendar.
    recurrence_rule TEXT,
    CONSTRAINT fk_repeticiones_frecuencia
        FOREIGN KEY (id_frecuencia) REFERENCES frecuencia(id) ON DELETE SET NULL,
    CONSTRAINT fk_repeticiones_actividad
        FOREIGN KEY (id_actividad) REFERENCES actividades(id) ON DELETE CASCADE
);

-- Preferencias y configuracion del usuario (segundo formulario post-login).
-- FLUJO: Despues del login Clerk, el usuario completa este formulario UNA SOLA VEZ.
-- Solo puede editar: ocupacion. Las horas de suenno NO son editables desde UI.
CREATE TABLE ajustes_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    -- Ocupacion del usuario (ingresada por el usuario en formulario post-login).
    ocupacion VARCHAR(50),
    -- Hora de inicio de suenno (no modificable desde UI, system-managed).
    -- Ejemplo: 22 (10 PM) - fuera de este horario el sistema puede sugerir actividades.
    hora_inicio INTEGER,
    -- Hora de fin de suenno (no modificable desde UI, system-managed).
    -- Ejemplo: 7 (7 AM) - fuera de este horario el sistema puede sugerir actividades.
    hora_fin INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ajustes_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Garantiza un solo registro de ajustes por usuario.
CREATE UNIQUE INDEX uq_ajustes_usuario_id_usuario
    ON ajustes_usuario(id_usuario);

