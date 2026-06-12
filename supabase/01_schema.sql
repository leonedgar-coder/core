-- =============================================================================
-- BD COLABORATIVA — SCHEMA SQL COMPLETO
-- Paso 2.1 | Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLA user_roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol      TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. TABLA personas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_elemento  TEXT,
  nombre           TEXT NOT NULL,
  foto_url         TEXT,
  fecha_registro   DATE,
  datos_extra      JSONB NOT NULL DEFAULT '{}',
  creado_por       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  eliminado        BOOLEAN NOT NULL DEFAULT false
);

-- -----------------------------------------------------------------------------
-- 3. TABLA objetos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.objetos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo             TEXT,
  nombre           TEXT NOT NULL,
  foto_url         TEXT,
  descripcion      TEXT,
  datos_extra      JSONB NOT NULL DEFAULT '{}',
  creado_por       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  eliminado        BOOLEAN NOT NULL DEFAULT false
);

-- -----------------------------------------------------------------------------
-- 4. TABLA columnas_extra
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.columnas_extra (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla        TEXT NOT NULL CHECK (tabla IN ('personas', 'objetos')),
  nombre_campo TEXT NOT NULL,
  etiqueta     TEXT NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('texto', 'numero', 'fecha', 'checkbox', 'seleccion')),
  opciones     JSONB,                          -- array de strings, solo para tipo 'seleccion'
  requerido    BOOLEAN NOT NULL DEFAULT false,
  activa       BOOLEAN NOT NULL DEFAULT true,  -- false = soft-delete de la columna
  orden        INT NOT NULL DEFAULT 0,
  creado_por   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tabla, nombre_campo)
);

-- -----------------------------------------------------------------------------
-- 5. FUNCIÓN + TRIGGER: actualizar actualizado_en automáticamente
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en personas
DROP TRIGGER IF EXISTS trg_personas_actualizado_en ON public.personas;
CREATE TRIGGER trg_personas_actualizado_en
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

-- Trigger en objetos
DROP TRIGGER IF EXISTS trg_objetos_actualizado_en ON public.objetos;
CREATE TRIGGER trg_objetos_actualizado_en
  BEFORE UPDATE ON public.objetos
  FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

-- -----------------------------------------------------------------------------
-- 6. ÍNDICES
-- -----------------------------------------------------------------------------

-- personas
CREATE INDEX IF NOT EXISTS idx_personas_creado_por     ON public.personas (creado_por);
CREATE INDEX IF NOT EXISTS idx_personas_actualizado_en ON public.personas (actualizado_en);
CREATE INDEX IF NOT EXISTS idx_personas_eliminado      ON public.personas (eliminado);

-- objetos
CREATE INDEX IF NOT EXISTS idx_objetos_creado_por     ON public.objetos (creado_por);
CREATE INDEX IF NOT EXISTS idx_objetos_actualizado_en ON public.objetos (actualizado_en);
CREATE INDEX IF NOT EXISTS idx_objetos_eliminado      ON public.objetos (eliminado);

-- columnas_extra
CREATE INDEX IF NOT EXISTS idx_columnas_extra_tabla_activa_orden
  ON public.columnas_extra (tabla, activa, orden);

-- =============================================================================
-- FIN DEL SCHEMA
-- =============================================================================
