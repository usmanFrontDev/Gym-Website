import { PAGE_SIZE } from '@/components/common/Pagination'
import { Rpc, Table } from '@/constants/tables'
import type { ActivityFilters, ActivityPage, ActivityRow, BridgeOverview } from '@/types/common/activity.types'
import { supabase, unwrap } from '../supabase-client'

export const activityService = {
  /** Merged feed: granted and denied punches plus onboarded members, newest first. */
  async list({ page, kind, search }: ActivityFilters): Promise<ActivityPage> {
    return unwrap(
      await supabase.rpc(Rpc.ListActivity, {
        p_kind: kind || null,
        p_search: search || null,
        p_page: page,
        p_page_size: PAGE_SIZE,
      }),
    ) as ActivityPage
  },

  async bridge(): Promise<BridgeOverview> {
    return unwrap(await supabase.rpc(Rpc.BridgeOverview)) as BridgeOverview
  },

  /** Realtime: pushes every heartbeat row the bridge writes. Returns an unsubscribe function. */
  subscribeBridge(onChange: (row: Partial<BridgeOverview>) => void): () => void {
    const channel = supabase
      .channel('bridge-status')
      .on<Partial<BridgeOverview>>('postgres_changes', { event: '*', schema: 'public', table: Table.BridgeStatus }, (payload) =>
        onChange(payload.new),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  },

  /** One punch with the scanned member's name and limited details (the RPC decides what the caller may see). */
  async byId(id: string): Promise<ActivityRow | null> {
    return unwrap(await supabase.rpc(Rpc.PunchDetails, { p_log_id: id })) as ActivityRow | null
  },

  /** Realtime: fires with the new row's id for every punch. Returns an unsubscribe function. */
  subscribe(onPunch: (id: string) => void): () => void {
    const channel = supabase
      .channel('attendance-punches')
      .on<{ id: string }>('postgres_changes', { event: 'INSERT', schema: 'public', table: Table.AttendanceLogs }, (payload) =>
        onPunch(payload.new.id),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  },
}
