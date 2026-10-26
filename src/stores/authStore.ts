import { create } from 'zustand'
import type { Profile } from '@/types/common/user.types'

interface AuthState {
  user: Profile | null
  ready: boolean
  setUser: (user: Profile | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user, ready: true }),
}))
