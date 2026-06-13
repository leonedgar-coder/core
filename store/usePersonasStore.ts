import { create } from 'zustand';
import { dbPersonas } from '@/lib/db';
import type { Persona, FiltroTabla } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface PersonasState {
  personas: Persona[];
  cargando: boolean;
  error: string | null;
  filtro: FiltroTabla;

  // Acciones de carga
  cargarPersonas: () => void;

  // CRUD — solo SQLite, sin Supabase (sync se hace en useSyncStore)
  crearPersona: (
    datos: Pick<Persona, 'nombre' | 'numero_elemento' | 'fecha_registro' | 'foto_local' | 'datos_extra'>,
    usuarioId: string
  ) => Promise<void>;
  actualizarPersona: (id: string, cambios: Partial<Persona>) => Promise<void>;
  eliminarPersona: (id: string) => Promise<void>;

  // Filtros
  setBusqueda: (texto: string) => void;
  setOrden: (campo: string, direccion: 'asc' | 'desc') => void;
  toggleMostrarEliminados: () => void;

  // Utilidades
  limpiarError: () => void;
  obtenerPorId: (id: string) => Persona | null;
}

// ---------------------------------------------------------------------------
// Generador de UUID simple (sin dependencias externas)
// ---------------------------------------------------------------------------
function generarUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const usePersonasStore = create<PersonasState>((set, get) => ({
  personas: [],
  cargando: false,
  error: null,
  filtro: {
    busqueda: '',
    mostrarEliminados: false,
    orden: undefined,
  },

  // -------------------------------------------------------------------------
  cargarPersonas: () => {
    set({ cargando: true, error: null });
    try {
      const personas = dbPersonas.obtenerTodas(get().filtro);
      set({ personas, cargando: false });
    } catch (e) {
      set({ error: `Error al cargar personas: ${e}`, cargando: false });
    }
  },

  // -------------------------------------------------------------------------
  crearPersona: async (datos, usuarioId) => {
    set({ cargando: true, error: null });
    try {
      const ahora = new Date().toISOString();
      const nuevaPersona: Omit<Persona, 'sincronizado' | 'pendiente_eliminar'> = {
        id: generarUUID(),
        nombre: datos.nombre,
        numero_elemento: datos.numero_elemento,
        fecha_registro: datos.fecha_registro,
        foto_local: datos.foto_local,
        foto_url: undefined,
        datos_extra: datos.datos_extra ?? {},
        creado_por: usuarioId,
        creado_en: ahora,
        actualizado_en: ahora,
        eliminado: false,
      };
      dbPersonas.insertar(nuevaPersona);
      get().cargarPersonas();
    } catch (e) {
      set({ error: `Error al crear persona: ${e}`, cargando: false });
      throw e;
    }
  },

  // -------------------------------------------------------------------------
  actualizarPersona: async (id, cambios) => {
    set({ error: null });
    try {
      dbPersonas.actualizar(id, cambios);
      get().cargarPersonas();
    } catch (e) {
      set({ error: `Error al actualizar persona: ${e}` });
      throw e;
    }
  },

  // -------------------------------------------------------------------------
  eliminarPersona: async (id) => {
    set({ error: null });
    try {
      dbPersonas.marcarEliminada(id);
      get().cargarPersonas();
    } catch (e) {
      set({ error: `Error al eliminar persona: ${e}` });
      throw e;
    }
  },

  // -------------------------------------------------------------------------
  setBusqueda: (texto) => {
    set((s) => ({ filtro: { ...s.filtro, busqueda: texto } }));
    get().cargarPersonas();
  },

  setOrden: (campo, direccion) => {
    set((s) => ({ filtro: { ...s.filtro, orden: { campo, direccion } } }));
    get().cargarPersonas();
  },

  toggleMostrarEliminados: () => {
    set((s) => ({
      filtro: { ...s.filtro, mostrarEliminados: !s.filtro.mostrarEliminados },
    }));
    get().cargarPersonas();
  },

  // -------------------------------------------------------------------------
  limpiarError: () => set({ error: null }),

  obtenerPorId: (id) => dbPersonas.obtenerPorId(id),
}));