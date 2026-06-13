// supabase/functions/admin-usuarios/index.ts
// Edge Function — Gestión de usuarios (solo accesible por admins)
//
// Endpoints:
//   GET    /admin-usuarios          → lista usuarios con rol
//   POST   /admin-usuarios/invitar  → { email } → invita usuario
//   POST   /admin-usuarios/cambiar-rol → { userId, nuevoRol }
//   POST   /admin-usuarios/desactivar  → { userId }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-usuarios/, '') || '/';

  // Crear cliente con service_role para operaciones de admin
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verificar que el caller es admin via JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'No autorizado' }, 401);
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) return json({ error: 'No autorizado' }, 401);

  // Verificar rol admin
  const { data: rolData } = await supabaseAdmin
    .from('user_roles')
    .select('rol')
    .eq('user_id', user.id)
    .single();

  if (rolData?.rol !== 'admin') return json({ error: 'Acceso denegado: se requiere rol admin' }, 403);

  // -------------------------------------------------------------------------
  // GET / — Listar usuarios
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && (path === '/' || path === '')) {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return json({ error: error.message }, 500);

    const { data: roles } = await supabaseAdmin.from('user_roles').select('*');
    const rolesMap = Object.fromEntries((roles ?? []).map(r => [r.user_id, r.rol]));

    const lista = authUsers.users.map(u => ({
      id: u.id,
      email: u.email,
      rol: rolesMap[u.id] ?? 'usuario',
      creado_en: u.created_at,
      ultimo_acceso: u.last_sign_in_at,
      activo: !u.banned_until,
    }));

    return json({ usuarios: lista });
  }

  // Parsear body para POST
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { /* body vacío */ }

  // -------------------------------------------------------------------------
  // POST /invitar — Invitar usuario por email
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && path === '/invitar') {
    const { email } = body;
    if (!email) return json({ error: 'Email requerido' }, 400);

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (error) return json({ error: error.message }, 400);

    // Asignar rol 'usuario' por defecto
    await supabaseAdmin.from('user_roles').upsert({
      user_id: data.user.id,
      rol: 'usuario',
      creado_en: new Date().toISOString(),
    });

    return json({ ok: true, userId: data.user.id });
  }

  // -------------------------------------------------------------------------
  // POST /cambiar-rol — Cambiar rol de usuario
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && path === '/cambiar-rol') {
    const { userId, nuevoRol } = body;
    if (!userId || !nuevoRol) return json({ error: 'userId y nuevoRol son requeridos' }, 400);
    if (!['admin', 'usuario'].includes(nuevoRol)) return json({ error: 'Rol inválido' }, 400);

    const { error } = await supabaseAdmin.from('user_roles').upsert({
      user_id: userId,
      rol: nuevoRol,
      creado_en: new Date().toISOString(),
    });

    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // -------------------------------------------------------------------------
  // POST /desactivar — Desactivar usuario (ban indefinido)
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && path === '/desactivar') {
    const { userId } = body;
    if (!userId) return json({ error: 'userId requerido' }, 400);
    if (userId === user.id) return json({ error: 'No puedes desactivarte a ti mismo' }, 400);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: '87600h', // 10 años ≈ permanente
    });

    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: 'Ruta no encontrada' }, 404);
});

// ---------------------------------------------------------------------------
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
