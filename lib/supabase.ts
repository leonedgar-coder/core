import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Validación de variables de entorno en tiempo de inicialización
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('REEMPLAZAR')) {
  throw new Error(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL no está configurada.\n' +
    'Edita el archivo .env y reemplaza el placeholder con tu URL de Supabase.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey.includes('REEMPLAZAR')) {
  throw new Error(
    '[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY no está configurada.\n' +
    'Edita el archivo .env y reemplaza el placeholder con tu anon key de Supabase.'
  );
}

// ---------------------------------------------------------------------------
// Adaptador de SecureStore para que Supabase pueda persistir la sesión
// en el almacenamiento seguro del dispositivo (Keychain / Keystore)
// ---------------------------------------------------------------------------
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    return SecureStore.deleteItemAsync(key);
  },
};

// ---------------------------------------------------------------------------
// Cliente de Supabase
// ---------------------------------------------------------------------------
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // Requerido en React Native — no hay URL de callback de OAuth
    detectSessionInUrl: false,
  },
});

// ---------------------------------------------------------------------------
// Tipos de la base de datos (placeholder hasta generar con Supabase CLI)
// Una vez que las tablas estén creadas, ejecutar:
//   npx supabase gen types typescript --project-id [TU_PROJECT_ID] > types/supabase.ts
// y reemplazar este export por el generado.
// ---------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          user_id: string;
          rol: 'admin' | 'usuario';
          creado_en: string;
        };
        Insert: {
          user_id: string;
          rol?: 'admin' | 'usuario';
          creado_en?: string;
        };
        Update: {
          rol?: 'admin' | 'usuario';
        };
      };
      personas: {
        Row: {
          id: string;
          numero_elemento: string | null;
          nombre: string;
          foto_url: string | null;
          fecha_registro: string | null;
          datos_extra: Record<string, unknown>;
          creado_por: string | null;
          creado_en: string;
          actualizado_en: string;
          eliminado: boolean;
        };
        Insert: Omit<Database['public']['Tables']['personas']['Row'], 'id' | 'creado_en' | 'actualizado_en'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['personas']['Insert']>;
      };
      objetos: {
        Row: {
          id: string;
          tipo: string | null;
          nombre: string;
          foto_url: string | null;
          descripcion: string | null;
          datos_extra: Record<string, unknown>;
          creado_por: string | null;
          creado_en: string;
          actualizado_en: string;
          eliminado: boolean;
        };
        Insert: Omit<Database['public']['Tables']['objetos']['Row'], 'id' | 'creado_en' | 'actualizado_en'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['objetos']['Insert']>;
      };
      columnas_extra: {
        Row: {
          id: string;
          tabla: 'personas' | 'objetos';
          nombre_campo: string;
          etiqueta: string;
          tipo: 'texto' | 'numero' | 'fecha' | 'checkbox' | 'seleccion';
          opciones: string[] | null;
          requerido: boolean;
          activa: boolean;
          orden: number;
          creado_por: string | null;
          creado_en: string;
        };
        Insert: Omit<Database['public']['Tables']['columnas_extra']['Row'], 'id' | 'creado_en'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['columnas_extra']['Insert']>;
      };
    };
  };
};