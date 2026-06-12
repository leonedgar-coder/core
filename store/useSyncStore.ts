import { create } from 'zustand';

interface SyncState {
  estado: 'idle';
}

export const useSyncStore = create<SyncState>(() => ({
  estado: 'idle',
}));