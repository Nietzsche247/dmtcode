import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewMode = 'research' | 'explorer';

interface ModeStore {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
}

export const useModeStore = create<ModeStore>()(
  persist(
    (set, get) => ({
      mode: 'research',
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === 'research' ? 'explorer' : 'research' }),
    }),
    {
      name: 'dmt-view-mode',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
