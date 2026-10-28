import { useEffect, useRef } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKey } from '@/constants/queryKeys'
import { activityService } from '@/services/common/activityService'
import { useUiStore } from '@/stores/uiStore'
import { enableAlertSound, playAlert } from '@/utils/alertPlayer'

export function useActivity(page: number) {
  return useQuery({
    queryKey: [QueryKey.Activity, page],
    queryFn: () => activityService.list(page),
    placeholderData: keepPreviousData,
  })
}

/** Mount once per dashboard: refreshes the table and plays the alert on every new punch. */
export function useActivityRealtime(onPunch?: (status: string) => void) {
  const queryClient = useQueryClient()
  const soundEnabled = useUiStore((s) => s.soundEnabled)
  const onPunchRef = useRef(onPunch)
  useEffect(() => {
    onPunchRef.current = onPunch
  })

  // After a reload the saved "sound on" choice needs one user gesture before the browser allows audio.
  useEffect(() => {
    if (!soundEnabled) return
    const unlock = () => enableAlertSound()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [soundEnabled])

  useEffect(() => {
    // Use the inserted row itself: the bridge can deliver a punch several seconds after it happened.
    return activityService.subscribe(async (id) => {
      await queryClient.invalidateQueries({ queryKey: [QueryKey.Activity] })
      const latest = await activityService.byId(id)
      if (!latest) return
      onPunchRef.current?.(latest.status)
      if (soundEnabled) playAlert(latest.status)
    })
  }, [queryClient, soundEnabled])
}
