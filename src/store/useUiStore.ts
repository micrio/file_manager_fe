import { create } from 'zustand';

// Tracks which row context-menu (the "three dots" popover) is currently open.
// Row menus stop propagation on their own click/mousedown handlers, which blocks
// Radix from seeing the outside interaction and auto-closing the previous menu.
// Making the popovers controlled against this single id guarantees only one is
// open at a time: opening another closes the first.
interface IUiState {
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}

export const useUiStore = create<IUiState>((set) => ({
  openMenuId: null,
  setOpenMenuId: (id) => set({ openMenuId: id }),
}));
