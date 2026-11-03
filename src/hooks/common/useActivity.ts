import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKey } from '@/constants/queryKeys'
import { activityService } from '@/services/common/activityService'
import type { ActivityFilters, ActivityRow, BridgeOverview } from '@/types/common/activity.types'
import { useUiStore } from '@/stores/uiStore'
import { enableAlertSound, playAlert } from '@/utils/alertPlayer'
import { clockOffset, isBridgeOnline } from '@/utils/bridge'

export function useActivity(filters: ActivityFilters) {
  return useQuery({
    queryKey: [QueryKey.Activity, filters],
    queryFn: () => activityService.list(filters),
    placeholderData: keepPreviousData,
  })
}

const CLOCK_TICK_MS = 5000

/**
 * One fetch, then heartbeats arrive over Realtime. A local timer re-evaluates "online" so the badge flips to
 * offline when heartbeats stop; that timer does not touch the network.
 */
export function useBridgeStatus() {
  const queryClient = useQueryClient()
  const [fetchedAt, setFetchedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const query = useQuery({
    queryKey: [QueryKey.BridgeStatus],
    queryFn: async () => {
      const overview = await activityService.bridge()
      setFetchedAt(Date.now())
      return overview
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  useEffect(
    () =>
      activityService.subscribeBridge((row) => {
        queryClient.setQueryData<BridgeOverview>([QueryKey.BridgeStatus], (prev) => ({
          server_time: new Date().toISOString(),
          ...prev,
          ...row,
          online: true,
        }))
        setFetchedAt(Date.now())
      }),
    [queryClient],
  )

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const bridge = query.data
  const offset = bridge ? clockOffset(bridge.server_time, fetchedAt) : 0
  const online = bridge ? isBridgeOnline(bridge.last_seen_at, now, offset) : false
  return { ...query, data: bridge ? { ...bridge, online } : bridge }
}

/** Mount once per dashboard: refreshes the table and plays the alert on every new punch. */
export function useActivityRealtime(onPunch?: (row: ActivityRow) => void) {
  const queryClient = useQueryClient()
  const soundEnabled = useUiStore((s) => s.soundEnabled)
  const speechEnabled = useUiStore((s) => s.speechEnabled)
  const volume = useUiStore((s) => s.volume)
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
      onPunchRef.current?.(latest)
      if (soundEnabled && latest.status !== 'ONBOARDED') playAlert(latest.status, { speech: speechEnabled, volume })
    })
  }, [queryClient, soundEnabled, speechEnabled, volume])
}
