import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  soundEnabled: boolean
  /** Spoken message ("Your fees is not paid") after the buzzer. */
  speechEnabled: boolean
  /** Alert loudness, 0.1 to 1. */
  volume: number
  setSoundEnabled: (enabled: boolean) => void
  setSpeechEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
}

/**
 * Alert preferences are remembered on this browser (the reception laptop). Browsers still block audio
 * after a reload until the first click or key press, which unlocks it (see useActivityRealtime).
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      soundEnabled: false,
      speechEnabled: true,
      volume: 0.6,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setSpeechEnabled: (speechEnabled) => set({ speechEnabled }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0.1, volume)) }),
    }),
    { name: 'gym-ui', partialize: (s) => ({ soundEnabled: s.soundEnabled, speechEnabled: s.speechEnabled, volume: s.volume }) },
  ),
)
