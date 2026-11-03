import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { QueryKey } from '@/constants/queryKeys'
import { authService } from '@/services/common/authService'
import { settingsService } from '@/services/common/settingsService'
import { useAuthStore } from '@/stores/authStore'
import type { ProfileValues } from '@/schemas/common/settings.schema'
import type { GymSettings } from '@/types/common/settings.types'

export function useGymSettings() {
  return useQuery({ queryKey: [QueryKey.GymSettings], queryFn: settingsService.gym, staleTime: 5 * 60 * 1000 })
}

export function useUpdateGymSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: GymSettings) => settingsService.updateGym(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QueryKey.GymSettings] })
      toast.success('Gym settings saved')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: async (values: ProfileValues) => {
      await settingsService.updateProfile(values)
      return authService.currentProfile()
    },
    onSuccess: (profile) => {
      setUser(profile)
      toast.success('Profile saved')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useChangePassword() {
  const email = useAuthStore((s) => s.user?.email ?? '')
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) => settingsService.changePassword(email, current, next),
    onSuccess: () => toast.success('Password changed'),
    onError: (error) => toast.error(error.message),
  })
}

export function useSignOutOtherDevices() {
  return useMutation({
    mutationFn: settingsService.signOutOtherDevices,
    onSuccess: () => toast.success('Other devices signed out'),
    onError: (error) => toast.error(error.message),
  })
}
