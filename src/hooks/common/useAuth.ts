import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authService } from '@/services/common/authService'
import { useAuthStore } from '@/stores/authStore'

/** Mount once at the app root: restores the session and follows auth changes. */
export function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser)
  useEffect(() => {
    authService.currentProfile().then(setUser, () => setUser(null))
    return authService.onAuthChange(setUser)
  }, [setUser])
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authService.signIn(email, password),
    onSuccess: (profile) => setUser(profile),
    onError: (error) => toast.error(error.message),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      setUser(null)
      queryClient.clear()
    },
    onError: (error) => toast.error(error.message),
  })
}
