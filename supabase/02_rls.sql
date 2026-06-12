-- =============================================================================
-- BD COLABORATIVA — POLÍTICAS RLS COMPLETAS
-- Paso 2.2 | Ejecutar DESPUÉS del 01_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FUNCIÓN HELPER: es_admin()
-- Usada en todas las políticas para verificar rol admin.
-- SECURITY DEFINER permite leer user_roles sin RLS circular.
-- -----------------------------------------------------------------------------
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

-- Cada usuario ve solo su propia fila; admins ven todas
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR public.es_admin()
  );

-- Solo admins pueden insertar roles
CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT WITH CHECK (public.es_admin());

-- Solo admins pueden actualizar roles
CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE USING (public.es_admin());

-- Solo admins pueden eliminar roles
CREATE POLICY "user_roles_delete" ON public.user_roles
  FOR DELETE USING (public.es_admin());

-- =============================================================================
-- TABLA: personas
-- =============================================================================
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- SELECT:
--   Usuarios normales: solo sus propios registros no eliminados
--   Admins: todos los registros (incluyendo eliminados)
CREATE POLICY "personas_select" ON public.personas
  FOR SELECT USING (
    public.es_admin()
    OR (creado_por = auth.uid() AND eliminado = false)
  );

-- INSERT: cualquier usuario autenticado, pero creado_por DEBE ser su propio uid
CREATE POLICY "personas_insert" ON public.personas
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND creado_por = auth.uid()
  );

-- UPDATE: solo el creador o un admin
CREATE POLICY "personas_update" ON public.personas
  FOR UPDATE USING (
    creado_por = auth.uid() OR public.es_admin()
  );

-- DELETE: solo admins (usamos borrado suave, pero la política debe existir)
CREATE POLICY "personas_delete" ON public.personas
  FOR DELETE USING (public.es_admin());

-- =============================================================================
-- TABLA: objetos
-- =============================================================================
ALTER TABLE public.objetos ENABLE ROW LEVEL SECURITY;

-- SELECT: misma lógica que personas
CREATE POLICY "objetos_select" ON public.objetos
  FOR SELECT USING (
    public.es_admin()
    OR (creado_por = auth.uid() AND eliminado = false)
  );

-- INSERT: autenticado, creado_por = auth.uid()
CREATE POLICY "objetos_insert" ON public.objetos
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND creado_por = auth.uid()
  );

-- UPDATE: creador o admin
CREATE POLICY "objetos_update" ON public.objetos
  FOR UPDATE USING (
    creado_por = auth.uid() OR public.es_admin()
  );

-- DELETE: solo admins
CREATE POLICY "objetos_delete" ON public.objetos
  FOR DELETE USING (public.es_admin());

-- =============================================================================
-- TABLA: columnas_extra
-- =============================================================================
ALTER TABLE public.columnas_extra ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier usuario autenticado puede leer columnas activas
CREATE POLICY "columnas_extra_select" ON public.columnas_extra
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND activa = true
  );

-- INSERT: solo admins
CREATE POLICY "columnas_extra_insert" ON public.columnas_extra
  FOR INSERT WITH CHECK (public.es_admin());

-- UPDATE: solo admins
CREATE POLICY "columnas_extra_update" ON public.columnas_extra
  FOR UPDATE USING (public.es_admin());

-- DELETE: solo admins (usamos soft-delete con campo activa, pero la política existe)
CREATE POLICY "columnas_extra_delete" ON public.columnas_extra
  FOR DELETE USING (public.es_admin());

-- =============================================================================
-- FIN DE LAS POLÍTICAS RLS
-- =============================================================================
