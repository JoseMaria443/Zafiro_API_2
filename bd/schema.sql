-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.actividades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL,
  id_etiqueta integer,
  google_event_id text,
  google_calendar_id character varying DEFAULT 'primary'::character varying,
  summary character varying NOT NULL,
  status character varying DEFAULT 'confirmed'::character varying,
  start_datetime timestamp with time zone,
  end_datetime timestamp with time zone,
  start_timezone character varying,
  end_timezone character varying,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  event_created timestamp with time zone,
  event_updated timestamp with time zone,
  transparency character varying,
  event_type character varying,
  recurring_event_id character varying,
  recurrence text[],
  frecuencia character varying,
  source character varying DEFAULT 'local'::character varying,
  last_synced_at timestamp with time zone,
  CONSTRAINT actividades_pkey PRIMARY KEY (id),
  CONSTRAINT fk_actividades_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id),
  CONSTRAINT fk_actividades_etiqueta FOREIGN KEY (id_etiqueta) REFERENCES public.etiquetas(id)
);
CREATE TABLE public.actividades_detalles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_actividad uuid NOT NULL,
  description text,
  location character varying,
  html_link text,
  ical_uid character varying,
  organizer_email character varying,
  organizer_display_name character varying,
  creator_email character varying,
  creator_display_name character varying,
  recurrence ARRAY,
  reminders_use_default boolean DEFAULT true,
  reminders_overrides jsonb,
  raw_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT actividades_detalles_pkey PRIMARY KEY (id),
  CONSTRAINT fk_actividades_detalles_actividad FOREIGN KEY (id_actividad) REFERENCES public.actividades(id)
);
CREATE OR REPLACE VIEW public.actividades_completa AS
SELECT 
  a.*,
  COALESCE(ad.recurrence, a.recurrence) AS recurrence
FROM public.actividades a
LEFT JOIN public.actividades_detalles ad ON a.id = ad.id_actividad;
CREATE TABLE public.ajustes_usuario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL,
  ocupacion character varying,
  hora_inicio integer,
  hora_fin integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ajustes_usuario_pkey PRIMARY KEY (id),
  CONSTRAINT fk_ajustes_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id)
);
CREATE TABLE public.etiquetas (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_usuario uuid NOT NULL,
  nombre character varying NOT NULL,
  color character varying,
  CONSTRAINT etiquetas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_etiquetas_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id)
);
CREATE TABLE public.prioridad (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_actividad uuid NOT NULL,
  valor USER-DEFINED NOT NULL,
  color character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prioridad_pkey PRIMARY KEY (id),
  CONSTRAINT fk_prioridad_actividad FOREIGN KEY (id_actividad) REFERENCES public.actividades(id)
);
CREATE TABLE public.user_google_connections (
  id_usuario uuid NOT NULL,
  google_email character varying,
  google_account_sub character varying,
  access_token text,
  refresh_token text,
  token_type character varying,
  scope text,
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_google_connections_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT fk_user_google_connections_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id)
);
CREATE TABLE public.user_google_sync_state (
  id_usuario uuid NOT NULL,
  google_calendar_id character varying NOT NULL DEFAULT 'primary'::character varying,
  sync_token text,
  last_synced_at timestamp with time zone,
  last_successful_sync_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_google_sync_state_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT fk_user_google_sync_state_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_user_id character varying NOT NULL UNIQUE,
  correo character varying UNIQUE,
  nombre character varying,
  token_google character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);