import { Table } from '@/constants/tables'
import { PAGE_SIZE } from '@/components/common/Pagination'
import type { ActivityRow } from '@/types/common/member.types'
import type { Paginated } from '@/types/common/api.types'
import { supabase, unwrap } from '../supabase-client'
import { toAppError } from '../appError'

export const activityService = {
  async list(page: number): Promise<Paginated<ActivityRow>> {
    const from = (page - 1) * PAGE_SIZE
    const { data, error, count } = await supabase
      .from(Table.AttendanceLogs)
      .select('id, fingerprint_id, punched_at, status, member:members(full_name), profile:profiles(full_name)', { count: 'exact' })
      .order('punched_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw toAppError(error)
    return { rows: data as unknown as ActivityRow[], total: count ?? 0 }
  },

  async byId(id: string): Promise<ActivityRow | null> {
    const rows = unwrap(
      await supabase
        .from(Table.AttendanceLogs)
        .select('id, fingerprint_id, punched_at, status, member:members(full_name), profile:profiles(full_name)')
        .eq('id', id)
        .limit(1),
    ) as unknown as ActivityRow[]
    return rows[0] ?? null
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
