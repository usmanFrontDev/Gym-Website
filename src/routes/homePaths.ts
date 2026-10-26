import { Path } from '@/constants/paths'
import { Role } from '@/constants/roles'

export const ROLE_HOME: Record<Role, Path> = {
  [Role.SUPER_ADMIN]: Path.AdminDashboard,
  [Role.MANAGER]: Path.ManagerDashboard,
  [Role.TRAINER]: Path.TrainerDashboard,
}
