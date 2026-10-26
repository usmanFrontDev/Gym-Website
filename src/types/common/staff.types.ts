import type { TrainerType } from '@/constants/roles'

export interface TrainerOption {
  id: string
  full_name: string
  trainer_type: TrainerType | null
}
