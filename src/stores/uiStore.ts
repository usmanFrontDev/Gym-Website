import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

/**
 * The sound choice is remembered on this browser (the reception laptop). Browsers still block audio
 * after a reload until the first click or key press, which unlocks it (see useActivityRealtime).
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      soundEnabled: false,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    { name: 'gym-ui', partialize: (s) => ({ soundEnabled: s.soundEnabled }) },
  ),
)
