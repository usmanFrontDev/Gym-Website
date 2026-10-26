import { Table } from '@/constants/tables'
import { Role } from '@/constants/roles'
import type { TrainerOption } from '@/types/common/staff.types'
import { supabase, unwrap } from '../supabase-client'

export const staffService = {
  async trainerOptions(): Promise<TrainerOption[]> {
    return unwrap(
      await supabase
        .from(Table.Profiles)
        .select('id, full_name, trainer_type')
        .eq('role', Role.TRAINER)
        .eq('blocked', false)
        .is('deleted_at', null)
        .order('full_name'),
    ) as TrainerOption[]
  },
}
