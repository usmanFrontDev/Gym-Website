import { Banknote, CalendarCheck, LayoutDashboard, ShieldCheck, Tags, TrendingUp, Settings, Users, Dumbbell, type LucideIcon } from 'lucide-react'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { Path } from '@/constants/paths'
import { Role } from '@/constants/roles'
import { strings } from '@/constants/strings'

export interface RouteEntry {
  path: Path
  element: LazyExoticComponent<ComponentType>
  roles: Role[] | 'all'
  nav?: { label: string; icon: LucideIcon }
}

const page = (loader: () => Promise<{ default: ComponentType }>) => lazy(loader)
const ADMIN = [Role.SUPER_ADMIN]
const MANAGER = [Role.MANAGER]
const TRAINER = [Role.TRAINER]

/** Adding a page = adding an entry here plus the page file. Router and sidebar are generated from it. */
export const routeRegistry: RouteEntry[] = [
  // super admin
  { path: Path.AdminDashboard, element: page(() => import('@/pages/superAdmin/DashboardPage')), roles: ADMIN, nav: { label: strings.nav.dashboard, icon: LayoutDashboard } },
  { path: Path.AdminMembers, element: page(() => import('@/pages/superAdmin/MembersPage')), roles: ADMIN, nav: { label: strings.nav.members, icon: Users } },
  { path: Path.AdminMemberNew, element: page(() => import('@/pages/superAdmin/MemberNewPage')), roles: ADMIN },
  { path: Path.AdminMemberDetail, element: page(() => import('@/pages/superAdmin/MemberDetailPage')), roles: ADMIN },
  { path: Path.AdminAttendance, element: page(() => import('@/pages/superAdmin/AttendancePage')), roles: ADMIN, nav: { label: strings.nav.attendance, icon: CalendarCheck } },
  { path: Path.AdminAttendanceDetail, element: page(() => import('@/pages/superAdmin/AttendanceDetailPage')), roles: ADMIN },
  { path: Path.AdminManagers, element: page(() => import('@/pages/superAdmin/ManagersPage')), roles: ADMIN, nav: { label: strings.nav.managers, icon: ShieldCheck } },
  { path: Path.AdminManagerDetail, element: page(() => import('@/pages/superAdmin/ManagerDetailPage')), roles: ADMIN },
  { path: Path.AdminTrainers, element: page(() => import('@/pages/superAdmin/TrainersPage')), roles: ADMIN, nav: { label: strings.nav.trainers, icon: Dumbbell } },
  { path: Path.AdminPlans, element: page(() => import('@/pages/superAdmin/PlansPage')), roles: ADMIN, nav: { label: strings.nav.plans, icon: Tags } },
  { path: Path.AdminExpenses, element: page(() => import('@/pages/superAdmin/ExpensesPage')), roles: ADMIN, nav: { label: strings.nav.expenses, icon: Banknote } },

  // manager
  { path: Path.ManagerDashboard, element: page(() => import('@/pages/manager/DashboardPage')), roles: MANAGER, nav: { label: strings.nav.dashboard, icon: LayoutDashboard } },
  { path: Path.ManagerStats, element: page(() => import('@/pages/manager/StatsPage')), roles: MANAGER, nav: { label: strings.nav.stats, icon: TrendingUp } },
  { path: Path.ManagerMembers, element: page(() => import('@/pages/manager/MembersPage')), roles: MANAGER, nav: { label: strings.nav.myMembers, icon: Users } },
  { path: Path.ManagerAttendance, element: page(() => import('@/pages/manager/AttendancePage')), roles: MANAGER, nav: { label: strings.nav.attendance, icon: CalendarCheck } },
  { path: Path.ManagerAttendanceDetail, element: page(() => import('@/pages/manager/AttendanceDetailPage')), roles: MANAGER },
  { path: Path.ManagerMemberNew, element: page(() => import('@/pages/manager/MemberNewPage')), roles: MANAGER },
  { path: Path.ManagerMemberDetail, element: page(() => import('@/pages/manager/MemberDetailPage')), roles: MANAGER },

  // trainer
  { path: Path.TrainerDashboard, element: page(() => import('@/pages/trainer/DashboardPage')), roles: TRAINER, nav: { label: strings.nav.dashboard, icon: LayoutDashboard } },
  { path: Path.TrainerMembers, element: page(() => import('@/pages/trainer/MembersPage')), roles: TRAINER, nav: { label: strings.nav.myMembers, icon: Users } },
  { path: Path.TrainerPerformance, element: page(() => import('@/pages/trainer/PerformancePage')), roles: TRAINER, nav: { label: strings.nav.performance, icon: TrendingUp } },

  // common
  { path: Path.Settings, element: page(() => import('@/pages/common/SettingsPage')), roles: 'all', nav: { label: strings.nav.settings, icon: Settings } },
  { path: Path.Profile, element: page(() => import('@/pages/common/ProfilePage')), roles: 'all' },
]
