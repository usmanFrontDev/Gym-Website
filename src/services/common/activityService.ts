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

  async byId(id: string): Promise<ActivityRow | null> {
    const rows = unwrap(
      await supabase
        .from(Table.AttendanceLogs)
        .select('id, fingerprint_id, punched_at, status, member_id, member:members(full_name), profile:profiles(full_name)')
        .eq('id', id)
        .limit(1),
    ) as unknown as {
      id: string
      fingerprint_id: string
      punched_at: string
      status: ActivityRow['status']
      member_id: string | null
      member: { full_name: string } | null
      profile: { full_name: string } | null
    }[]
    const row = rows[0]
    if (!row) return null
    return {
      id: row.id,
      at: row.punched_at,
      fingerprint_id: row.fingerprint_id,
      status: row.status,
      kind: row.status === 'ACTIVE' || row.status === 'STAFF' ? 'GRANTED' : 'DENIED',
      name: row.member?.full_name ?? row.profile?.full_name ?? null,
      member_id: row.member_id,
    }
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
