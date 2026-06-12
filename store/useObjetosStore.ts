import { create } from 'zustand';

interface ObjetosState {
  objetos: never[];
}

export const useObjetosStore = create<ObjetosState>(() => ({
  objetos: [],
}));