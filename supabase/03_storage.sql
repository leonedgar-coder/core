-- =============================================================================
-- BD COLABORATIVA — SUPABASE STORAGE (versión idempotente)
-- Paso 2.3 | Usar DROP POLICY IF EXISTS para re-ejecutar sin errores
-- =============================================================================
--
-- PASO PREVIO (hacer manualmente en el Dashboard):
-- Storage → New bucket
--   • fotos-personas  → Public: ✅, Max size: 2MB, MIME: image/jpeg, image/png, image/webp
--   • fotos-objetos   → misma configuración
--
-- =============================================================================

-- fotos-personas: SELECT (público)
DROP POLICY IF EXISTS "fotos_personas_select" ON storage.objects;
CREATE POLICY "fotos_personas_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-personas');

-- fotos-objetos: SELECT (público)
DROP POLICY IF EXISTS "fotos_objetos_select" ON storage.objects;
CREATE POLICY "fotos_objetos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-objetos');

-- fotos-personas: INSERT (autenticado, path = {user_id}/archivo)
DROP POLICY IF EXISTS "fotos_personas_insert" ON storage.objects;
CREATE POLICY "fotos_personas_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos-personas'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- fotos-objetos: INSERT
DROP POLICY IF EXISTS "fotos_objetos_insert" ON storage.objects;
CREATE POLICY "fotos_objetos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos-objetos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- fotos-personas: UPDATE (dueño o admin)
DROP POLICY IF EXISTS "fotos_personas_update" ON storage.objects;
CREATE POLICY "fotos_personas_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fotos-personas'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.es_admin()
    )
  );

-- fotos-objetos: UPDATE
DROP POLICY IF EXISTS "fotos_objetos_update" ON storage.objects;
CREATE POLICY "fotos_objetos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fotos-objetos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.es_admin()
    )
  );

-- fotos-personas: DELETE (solo admin)
DROP POLICY IF EXISTS "fotos_personas_delete" ON storage.objects;
CREATE POLICY "fotos_personas_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fotos-personas' AND public.es_admin());

-- fotos-objetos: DELETE
DROP POLICY IF EXISTS "fotos_objetos_delete" ON storage.objects;
CREATE POLICY "fotos_objetos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fotos-objetos' AND public.es_admin());
