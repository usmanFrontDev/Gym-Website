import { Rpc } from '@/constants/tables'
import type { ManagerStats, TrainerCommissionLine, TrainerStats } from '@/types/common/stats.types'
import { supabase, unwrap } from '../supabase-client'

export const statsService = {
  async managerStats(managerId?: string): Promise<ManagerStats> {
    return unwrap(await supabase.rpc(Rpc.ManagerStats, { p_manager_id: managerId ?? null })) as ManagerStats
  },
  async trainerStats(trainerId?: string): Promise<TrainerStats> {
    return unwrap(await supabase.rpc(Rpc.TrainerStats, { p_trainer_id: trainerId ?? null })) as TrainerStats
  },
  async trainerCommissions(trainerId?: string): Promise<TrainerCommissionLine[]> {
    return unwrap(await supabase.rpc(Rpc.TrainerMemberCommissions, { p_trainer_id: trainerId ?? null })) as TrainerCommissionLine[]
  },
}
