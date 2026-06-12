import { create } from 'zustand';

interface PersonasState {
  personas: never[];
}

export const usePersonasStore = create<PersonasState>(() => ({
  personas: [],
}));