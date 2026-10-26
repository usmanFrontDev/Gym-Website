import { useEffect, useRef } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKey } from '@/constants/queryKeys'
import { activityService } from '@/services/common/activityService'
import { useUiStore } from '@/stores/uiStore'
import { playAlert } from '@/utils/alertPlayer'

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

  useEffect(() => {
    return activityService.subscribe(async () => {
      await queryClient.invalidateQueries({ queryKey: [QueryKey.Activity] })
      const latest = await activityService.latestWithin(10)
      if (!latest) return
      onPunchRef.current?.(latest.status)
      if (soundEnabled) playAlert(latest.status)
    })
  }, [queryClient, soundEnabled])
}
