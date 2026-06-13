-- =============================================================================
-- BD COLABORATIVA — POLÍTICAS RLS COMPLETAS (versión idempotente)
-- Paso 2.2 | Usa DROP IF EXISTS para poder re-ejecutar sin errores
-- =============================================================================

-- Función helper es_admin() (idempotente por usar CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- TABLA: user_roles
-- =============================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE USING (public.es_admin());

DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
CREATE POLICY "user_roles_delete" ON public.user_roles
  FOR DELETE USING (public.es_admin());

-- =============================================================================
-- TABLA: personas
-- =============================================================================
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "personas_select" ON public.personas;
CREATE POLICY "personas_select" ON public.personas
  FOR SELECT USING (
    public.es_admin()
    OR (creado_por = auth.uid() AND eliminado = false)
  );

DROP POLICY IF EXISTS "personas_insert" ON public.personas;
CREATE POLICY "personas_insert" ON public.personas
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND creado_por = auth.uid()
  );

DROP POLICY IF EXISTS "personas_update" ON public.personas;
CREATE POLICY "personas_update" ON public.personas
  FOR UPDATE USING (creado_por = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "personas_delete" ON public.personas;
CREATE POLICY "personas_delete" ON public.personas
  FOR DELETE USING (public.es_admin());

-- =============================================================================
-- TABLA: objetos
-- =============================================================================
ALTER TABLE public.objetos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "objetos_select" ON public.objetos;
CREATE POLICY "objetos_select" ON public.objetos
  FOR SELECT USING (
    public.es_admin()
    OR (creado_por = auth.uid() AND eliminado = false)
  );

DROP POLICY IF EXISTS "objetos_insert" ON public.objetos;
CREATE POLICY "objetos_insert" ON public.objetos
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND creado_por = auth.uid()
  );

DROP POLICY IF EXISTS "objetos_update" ON public.objetos;
CREATE POLICY "objetos_update" ON public.objetos
  FOR UPDATE USING (creado_por = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "objetos_delete" ON public.objetos;
CREATE POLICY "objetos_delete" ON public.objetos
  FOR DELETE USING (public.es_admin());

-- =============================================================================
-- TABLA: columnas_extra
-- =============================================================================
ALTER TABLE public.columnas_extra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "columnas_extra_select" ON public.columnas_extra;
CREATE POLICY "columnas_extra_select" ON public.columnas_extra
  FOR SELECT USING (auth.uid() IS NOT NULL AND activa = true);

DROP POLICY IF EXISTS "columnas_extra_insert" ON public.columnas_extra;
CREATE POLICY "columnas_extra_insert" ON public.columnas_extra
  FOR INSERT WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "columnas_extra_update" ON public.columnas_extra;
CREATE POLICY "columnas_extra_update" ON public.columnas_extra
  FOR UPDATE USING (public.es_admin());

DROP POLICY IF EXISTS "columnas_extra_delete" ON public.columnas_extra;
CREATE POLICY "columnas_extra_delete" ON public.columnas_extra
  FOR DELETE USING (public.es_admin());
