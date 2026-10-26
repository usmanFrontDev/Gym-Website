import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { Path } from '@/constants/paths'
import { Role } from '@/constants/roles'
import { strings } from '@/constants/strings'

export interface RouteEntry {
  path: Path
  element: LazyExoticComponent<ComponentType>
  roles: Role[] | 'all'
  nav?: { label: string }
}

const page = (loader: () => Promise<{ default: ComponentType }>) => lazy(loader)
const ADMIN = [Role.SUPER_ADMIN]
const MANAGER = [Role.MANAGER]
const TRAINER = [Role.TRAINER]

/** Adding a page = adding an entry here plus the page file. Router and sidebar are generated from it. */
export const routeRegistry: RouteEntry[] = [
  // super admin
  { path: Path.AdminDashboard, element: page(() => import('@/pages/superAdmin/DashboardPage')), roles: ADMIN, nav: { label: strings.nav.dashboard } },
  { path: Path.AdminMembers, element: page(() => import('@/pages/superAdmin/MembersPage')), roles: ADMIN, nav: { label: strings.nav.members } },
  { path: Path.AdminMemberNew, element: page(() => import('@/pages/superAdmin/MemberNewPage')), roles: ADMIN },
  { path: Path.AdminMemberDetail, element: page(() => import('@/pages/superAdmin/MemberDetailPage')), roles: ADMIN },
  { path: Path.AdminManagers, element: page(() => import('@/pages/superAdmin/ManagersPage')), roles: ADMIN, nav: { label: strings.nav.managers } },
  { path: Path.AdminManagerDetail, element: page(() => import('@/pages/superAdmin/ManagerDetailPage')), roles: ADMIN },
  { path: Path.AdminTrainers, element: page(() => import('@/pages/superAdmin/TrainersPage')), roles: ADMIN, nav: { label: strings.nav.trainers } },
  { path: Path.AdminExpenses, element: page(() => import('@/pages/superAdmin/ExpensesPage')), roles: ADMIN, nav: { label: strings.nav.expenses } },

  // manager
  { path: Path.ManagerDashboard, element: page(() => import('@/pages/manager/DashboardPage')), roles: MANAGER, nav: { label: strings.nav.dashboard } },
  { path: Path.ManagerStats, element: page(() => import('@/pages/manager/StatsPage')), roles: MANAGER, nav: { label: strings.nav.stats } },
  { path: Path.ManagerMembers, element: page(() => import('@/pages/manager/MembersPage')), roles: MANAGER, nav: { label: strings.nav.myMembers } },
  { path: Path.ManagerMemberNew, element: page(() => import('@/pages/manager/MemberNewPage')), roles: MANAGER },
  { path: Path.ManagerMemberDetail, element: page(() => import('@/pages/manager/MemberDetailPage')), roles: MANAGER },

  // trainer
  { path: Path.TrainerDashboard, element: page(() => import('@/pages/trainer/DashboardPage')), roles: TRAINER, nav: { label: strings.nav.dashboard } },
  { path: Path.TrainerMembers, element: page(() => import('@/pages/trainer/MembersPage')), roles: TRAINER, nav: { label: strings.nav.myMembers } },
  { path: Path.TrainerPerformance, element: page(() => import('@/pages/trainer/PerformancePage')), roles: TRAINER, nav: { label: strings.nav.performance } },

  // common
  { path: Path.Profile, element: page(() => import('@/pages/common/ProfilePage')), roles: 'all', nav: { label: strings.nav.profile } },
]
