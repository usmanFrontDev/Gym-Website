import type { Role, TrainerType } from '@/constants/roles'

export interface Profile {
  id: string
  role: Role
  full_name: string
  father_name: string | null
  cnic: string | null
  phone: string | null
  address: string | null
  email: string
  trainer_type: TrainerType | null
  fingerprint_id: string | null
  blocked: boolean
  deleted_at: string | null
  created_at: string
}
