import { create } from 'zustand';

// State UI dashboard yang dipakai bersama oleh Sidebar (folder), Header (search) dan halaman My Projects.
interface DashboardUIState {
  /** 'ALL' = semua proyek, selain itu = id folder yang sedang dipilih */
  activeFolderId: string;
  searchQuery: string;
  setActiveFolderId: (id: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardUIState>((set) => ({
  activeFolderId: 'ALL',
  searchQuery: '',
  setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
