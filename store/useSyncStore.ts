import { create } from 'zustand';
import { dbPersonas, dbObjetos, dbMeta } from '@/lib/db';
import type { EstadoSync } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface SyncState {
  estado: EstadoSync;
  ultimaSync: string | null;
  pendientes: number;
  error: string | null;

  // Acciones
  contarPendientes: () => void;
  setEstado: (estado: EstadoSync) => void;
  setUltimaSync: (timestamp: string) => void;
  setError: (error: string) => void;
  limpiarError: () => void;
}

// ---------------------------------------------------------------------------
export const useSyncStore = create<SyncState>((set) => ({
  estado: 'idle',
  ultimaSync: null,
  pendientes: 0,
  error: null,

  // -------------------------------------------------------------------------
  // Cuenta todos los registros no sincronizados en personas + objetos
  contarPendientes: () => {
    try {
      const pendientesPersonas = dbPersonas.obtenerPendientes().length;
      const pendientesObjetos = dbObjetos.obtenerPendientes().length;
      const total = pendientesPersonas + pendientesObjetos;

      // Leer última sync desde SQLite
      const ultimaPersonas = dbMeta.getUltimaSync('personas');
      const ultimaObjetos = dbMeta.getUltimaSync('objetos');
      // La más reciente de las dos
      const ultimaSync =
        ultimaPersonas > ultimaObjetos ? ultimaPersonas : ultimaObjetos;

      set({
        pendientes: total,
        ultimaSync: ultimaSync === '1970-01-01T00:00:00Z' ? null : ultimaSync,
      });
    } catch (e) {
      set({ error: `Error al contar pendientes: ${e}` });
    }
  },

  setEstado: (estado) => set({ estado }),

  setUltimaSync: (timestamp) => set({ ultimaSync: timestamp }),

  setError: (error) => set({ error, estado: 'error' }),

  limpiarError: () => set({ error: null, estado: 'idle' }),
}));