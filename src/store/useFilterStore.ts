// src/store/useFilterStore.ts
import { create } from 'zustand';

interface FilterStore {
  activeTable: any | null; // Stores the TanStack table instance
  setActiveTable: (table: any) => void;
  savedFilters: any[];
  setSavedFilters: (filters: any[]) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  activeTable: null,
  setActiveTable: (table) => set({ activeTable: table }),
  savedFilters: [],
  setSavedFilters: (filters) => set({ savedFilters: filters }),
}));