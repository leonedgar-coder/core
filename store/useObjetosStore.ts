import { create } from 'zustand';
import { dbObjetos } from '@/lib/db';
import type { Objeto, FiltroTabla } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface ObjetosState {
  objetos: Objeto[];
  cargando: boolean;
  error: string | null;
  filtro: FiltroTabla;

  cargarObjetos: () => void;
  crearObjeto: (
    datos: Pick<Objeto, 'nombre' | 'tipo' | 'descripcion' | 'foto_local' | 'datos_extra'>,
    usuarioId: string
  ) => Promise<void>;
  actualizarObjeto: (id: string, cambios: Partial<Objeto>) => Promise<void>;
  eliminarObjeto: (id: string) => Promise<void>;

  setBusqueda: (texto: string) => void;
  setOrden: (campo: string, direccion: 'asc' | 'desc') => void;
  toggleMostrarEliminados: () => void;

  limpiarError: () => void;
  obtenerPorId: (id: string) => Objeto | null;
}

// ---------------------------------------------------------------------------
function generarUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
export const useObjetosStore = create<ObjetosState>((set, get) => ({
  objetos: [],
  cargando: false,
  error: null,
  filtro: {
    busqueda: '',
    mostrarEliminados: false,
    orden: undefined,
  },

  cargarObjetos: () => {
    set({ cargando: true, error: null });
    try {
      const objetos = dbObjetos.obtenerTodos(get().filtro);
      set({ objetos, cargando: false });
    } catch (e) {
      set({ error: `Error al cargar objetos: ${e}`, cargando: false });
    }
  },

  crearObjeto: async (datos, usuarioId) => {
    set({ cargando: true, error: null });
    try {
      const ahora = new Date().toISOString();
      const nuevoObjeto: Omit<Objeto, 'sincronizado' | 'pendiente_eliminar'> = {
        id: generarUUID(),
        nombre: datos.nombre,
        tipo: datos.tipo,
        descripcion: datos.descripcion,
        foto_local: datos.foto_local,
        foto_url: undefined,
        datos_extra: datos.datos_extra ?? {},
        creado_por: usuarioId,
        creado_en: ahora,
        actualizado_en: ahora,
        eliminado: false,
      };
      dbObjetos.insertar(nuevoObjeto);
      get().cargarObjetos();
    } catch (e) {
      set({ error: `Error al crear objeto: ${e}`, cargando: false });
      throw e;
    }
  },

  actualizarObjeto: async (id, cambios) => {
    set({ error: null });
    try {
      dbObjetos.actualizar(id, cambios);
      get().cargarObjetos();
    } catch (e) {
      set({ error: `Error al actualizar objeto: ${e}` });
      throw e;
    }
  },

  eliminarObjeto: async (id) => {
    set({ error: null });
    try {
      dbObjetos.marcarEliminado(id);
      get().cargarObjetos();
    } catch (e) {
      set({ error: `Error al eliminar objeto: ${e}` });
      throw e;
    }
  },

  setBusqueda: (texto) => {
    set((s) => ({ filtro: { ...s.filtro, busqueda: texto } }));
    get().cargarObjetos();
  },

  setOrden: (campo, direccion) => {
    set((s) => ({ filtro: { ...s.filtro, orden: { campo, direccion } } }));
    get().cargarObjetos();
  },

  toggleMostrarEliminados: () => {
    set((s) => ({
      filtro: { ...s.filtro, mostrarEliminados: !s.filtro.mostrarEliminados },
    }));
    get().cargarObjetos();
  },

  limpiarError: () => set({ error: null }),

  obtenerPorId: (id) => dbObjetos.obtenerPorId(id),
}));