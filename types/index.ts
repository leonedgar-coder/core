// =============================================================================
// TIPOS DEL PROYECTO — BD Colaborativa
// =============================================================================

// ---------------------------------------------------------------------------
// Enums / Unions simples
// ---------------------------------------------------------------------------

export type Rol = 'admin' | 'usuario';

export type TipoColumna = 'texto' | 'numero' | 'fecha' | 'checkbox' | 'seleccion';

export type EstadoSync = 'idle' | 'sincronizando' | 'ok' | 'error' | 'sin_internet';

export type TablaDB = 'personas' | 'objetos';

// ---------------------------------------------------------------------------
// Columnas dinámicas
// ---------------------------------------------------------------------------

export interface ColumnaExtra {
  id: string;
  tabla: TablaDB;
  /** Nombre usado como key en datos_extra (snake_case) */
  nombre_campo: string;
  /** Nombre legible para mostrar en UI */
  etiqueta: string;
  tipo: TipoColumna;
  /** Solo para tipo 'seleccion' */
  opciones?: string[];
  requerido: boolean;
  orden: number;
  /** false = soft-delete de la columna */
  activa: boolean;
  creado_en: string;
}

// ---------------------------------------------------------------------------
// Entidades principales
// ---------------------------------------------------------------------------

export interface Persona {
  id: string;
  numero_elemento?: string;
  nombre: string;
  /** URL de Supabase Storage (después de sincronizar) */
  foto_url?: string;
  /** URI local antes de sincronizar */
  foto_local?: string;
  /** ISO date string YYYY-MM-DD */
  fecha_registro?: string;
  /** Campos dinámicos serializados como JSON en SQLite, objeto en memoria */
  datos_extra: Record<string, unknown>;
  creado_por: string;
  creado_en: string;
  actualizado_en: string;
  eliminado: boolean;
  /** Solo en capa local SQLite */
  sincronizado?: boolean;
  /** Solo en capa local SQLite */
  pendiente_eliminar?: boolean;
}

export interface Objeto {
  id: string;
  tipo?: string;
  nombre: string;
  foto_url?: string;
  foto_local?: string;
  descripcion?: string;
  datos_extra: Record<string, unknown>;
  creado_por: string;
  creado_en: string;
  actualizado_en: string;
  eliminado: boolean;
  sincronizado?: boolean;
  pendiente_eliminar?: boolean;
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

export interface UsuarioApp {
  /** UUID de Supabase Auth */
  id: string;
  email: string;
  rol: Rol;
  creado_en: string;
}

// ---------------------------------------------------------------------------
// Filtros y ordenamiento
// ---------------------------------------------------------------------------

export type OrdenColumna = {
  campo: string;
  direccion: 'asc' | 'desc';
};

export interface FiltroTabla {
  busqueda: string;
  orden?: OrdenColumna;
  /** Solo accesible para admins */
  mostrarEliminados: boolean;
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

export interface ResultadoSync {
  tabla: TablaDB;
  registrosSubidos: number;
  registrosBajados: number;
  errores: string[];
  timestamp: string;
}