import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Example Zustand store — client-side UI state only.
 * Server data (anything fetched from the API) belongs in TanStack Query
 * (see api/contacts.ts), never in a store.
 */
interface UiState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  immer((set) => ({
    isSidebarOpen: false,
    toggleSidebar: () => {
      set((state) => {
        state.isSidebarOpen = !state.isSidebarOpen;
      });
    },
  }))
);
