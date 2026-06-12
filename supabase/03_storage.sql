-- =============================================================================
-- BD COLABORATIVA — SUPABASE STORAGE
-- Paso 2.3 | Ejecutar DESPUÉS de los pasos anteriores
-- =============================================================================
--
-- PASO 1: Crear buckets en el Dashboard de Supabase
-- ─────────────────────────────────────────────────
-- Ve a: Storage → New bucket
--
-- Bucket 1:
--   Name: fotos-personas
--   Public bucket: ✅ (activado)
--   Allowed MIME types: image/jpeg, image/png, image/webp
--   Max upload size: 2 MB (2097152 bytes)
--
-- Bucket 2:
--   Name: fotos-objetos
--   Misma configuración que fotos-personas
--
-- ─────────────────────────────────────────────────
-- PASO 2: Políticas de Storage (ejecutar este SQL)
-- ─────────────────────────────────────────────────

-- SELECT (leer/descargar): cualquier persona, incluso sin autenticar
-- Las fotos son públicas para mostrarse en la app
CREATE POLICY "fotos_personas_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-personas');

CREATE POLICY "fotos_objetos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-objetos');

-- INSERT (subir): solo usuarios autenticados
-- El path DEBE empezar con el user_id del usuario que sube
-- Estructura obligatoria: {user_id}/{nombre_archivo}.jpg
CREATE POLICY "fotos_personas_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos-personas'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "fotos_objetos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos-objetos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: el dueño del archivo o un admin
CREATE POLICY "fotos_personas_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fotos-personas'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.es_admin()
    )
  );

CREATE POLICY "fotos_objetos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fotos-objetos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.es_admin()
    )
  );

-- DELETE: solo admins
CREATE POLICY "fotos_personas_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fotos-personas'
    AND public.es_admin()
  );

CREATE POLICY "fotos_objetos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fotos-objetos'
    AND public.es_admin()
  );

-- =============================================================================
-- FIN DEL STORAGE
-- =============================================================================
