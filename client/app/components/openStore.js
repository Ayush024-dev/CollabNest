// openStore.js
import { create } from 'zustand';

export const useOpenStore = create((set) => ({
  open: false,
  toggleOpen: () => set((state) => ({ open: !state.open })),
  setOpen: (value) => set({ open: value }),
}));
