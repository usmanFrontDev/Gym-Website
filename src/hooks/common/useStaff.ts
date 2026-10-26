import { useQuery } from '@tanstack/react-query'
import { QueryKey } from '@/constants/queryKeys'
import { staffService } from '@/services/common/staffService'

export function useTrainerOptions() {
  return useQuery({ queryKey: [QueryKey.Trainers, 'options'], queryFn: staffService.trainerOptions })
}
