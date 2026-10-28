import { Table } from '@/constants/tables'
import type { DeviceEnrollment } from '@/types/common/enrollment.types'
import { supabase, unwrap } from '../supabase-client'

const COLUMNS = 'id, status, fingerprint_id, error'

export const enrollmentService = {
  /** Queues a scan; the bridge picks the device user ID and drives the scanner. */
  async start(): Promise<DeviceEnrollment> {
    return unwrap(
      await supabase.from(Table.DeviceEnrollments).insert({ status: 'PENDING' }).select(COLUMNS).single(),
    ) as DeviceEnrollment
  },

  async get(id: string): Promise<DeviceEnrollment> {
    return unwrap(await supabase.from(Table.DeviceEnrollments).select(COLUMNS).eq('id', id).single()) as DeviceEnrollment
  },

  async cancel(id: string): Promise<void> {
    unwrap(await supabase.from(Table.DeviceEnrollments).update({ status: 'CANCELLED' }).eq('id', id))
  },
}
