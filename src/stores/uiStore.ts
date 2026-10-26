import { create } from 'zustand'

interface UiState {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

/** Sound is per page load: it only plays in the session where "Enable sound" was clicked. */
export const useUiStore = create<UiState>((set) => ({
  soundEnabled: false,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
}))
