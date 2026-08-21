import { create } from 'zustand'

export const useUiStore = create((set) => ({
  navOpen: false,
  closeNav: () => set({ navOpen: false }),
  toggleNav: () => set((s) => ({ navOpen: !s.navOpen })),
}))
