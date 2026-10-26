import { useQuery } from '@tanstack/react-query'
import { QueryKey } from '@/constants/queryKeys'
import { statsService } from '@/services/common/statsService'

export function useManagerStats(managerId?: string) {
  return useQuery({ queryKey: [QueryKey.ManagerStats, managerId ?? 'me'], queryFn: () => statsService.managerStats(managerId) })
}

export function useTrainerStats(trainerId?: string) {
  return useQuery({ queryKey: [QueryKey.TrainerStats, trainerId ?? 'me'], queryFn: () => statsService.trainerStats(trainerId) })
}

export function useTrainerCommissions(trainerId?: string) {
  return useQuery({
    queryKey: [QueryKey.TrainerStats, 'lines', trainerId ?? 'me'],
    queryFn: () => statsService.trainerCommissions(trainerId),
  })
}
