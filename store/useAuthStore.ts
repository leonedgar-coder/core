import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { UsuarioApp } from '@/types';

// ---------------------------------------------------------------------------
// Tipos del store
// ---------------------------------------------------------------------------
interface AuthState {
  usuario: UsuarioApp | null;
  sesionCargando: boolean;
  error: string | null;

  // Acciones
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  verificarSesion: () => Promise<void>;
  limpiarError: () => void;

  // Selector derivado
  esAdmin: boolean;
}

// ---------------------------------------------------------------------------
// Helper: obtener el rol del usuario desde la tabla user_roles
// ---------------------------------------------------------------------------
async function obtenerRol(userId: string): Promise<'admin' | 'usuario'> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('rol')
    .eq('user_id', userId)
    .single();

  if (error || !data) return 'usuario'; // default si no tiene fila
  return data.rol as 'admin' | 'usuario';
}

// ---------------------------------------------------------------------------
// Store de autenticación
// ---------------------------------------------------------------------------
export const useAuthStore = create<AuthState>((set, get) => {
  // Escuchar cambios de sesión (expiración, logout externo, etc.)
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      set({ usuario: null, sesionCargando: false, esAdmin: false });
    }
  });

  return {
    usuario: null,
    sesionCargando: true, // true al inicio — verificarSesion lo pone en false
    error: null,
    esAdmin: false,

    // -------------------------------------------------------------------------
    iniciarSesion: async (email: string, password: string) => {
      set({ error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const mensaje =
          error.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos'
            : error.message === 'Email not confirmed'
            ? 'Debes confirmar tu email antes de iniciar sesión'
            : `Error al iniciar sesión: ${error.message}`;
        set({ error: mensaje });
        throw new Error(mensaje);
      }

      if (!data.user) {
        set({ error: 'No se pudo obtener el usuario' });
        throw new Error('No se pudo obtener el usuario');
      }

      const rol = await obtenerRol(data.user.id);

      const usuario: UsuarioApp = {
        id: data.user.id,
        email: data.user.email ?? '',
        rol,
        creado_en: data.user.created_at ?? new Date().toISOString(),
      };

      set({ usuario, esAdmin: rol === 'admin', error: null });
    },

    // -------------------------------------------------------------------------
    cerrarSesion: async () => {
      await supabase.auth.signOut();
      set({ usuario: null, esAdmin: false, error: null });
    },

    // -------------------------------------------------------------------------
    verificarSesion: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          set({ usuario: null, esAdmin: false, sesionCargando: false });
          return;
        }

        const rol = await obtenerRol(session.user.id);

        const usuario: UsuarioApp = {
          id: session.user.id,
          email: session.user.email ?? '',
          rol,
          creado_en: session.user.created_at ?? new Date().toISOString(),
        };

        set({ usuario, esAdmin: rol === 'admin', sesionCargando: false });
      } catch {
        // Si hay cualquier error (sin internet, etc.), continuar sin sesión
        set({ usuario: null, esAdmin: false, sesionCargando: false });
      }
    },

    // -------------------------------------------------------------------------
    limpiarError: () => set({ error: null }),
  };
});