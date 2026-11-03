export enum Path {
  Root = '/',
  Login = '/login',
  Forbidden = '/forbidden',
  Profile = '/profile',
  Settings = '/settings',

  AdminDashboard = '/admin',
  AdminMembers = '/admin/members',
  AdminMemberNew = '/admin/members/new',
  AdminMemberDetail = '/admin/members/:memberId',
  AdminManagers = '/admin/managers',
  AdminManagerDetail = '/admin/managers/:managerId',
  AdminTrainers = '/admin/trainers',
  AdminExpenses = '/admin/expenses',
  AdminPlans = '/admin/plans',
  AdminAttendance = '/admin/attendance',
  AdminAttendanceDetail = '/admin/attendance/:memberId',

  ManagerDashboard = '/manager',
  ManagerStats = '/manager/stats',
  ManagerMembers = '/manager/members',
  ManagerMemberNew = '/manager/members/new',
  ManagerMemberDetail = '/manager/members/:memberId',
  ManagerAttendance = '/manager/attendance',
  ManagerAttendanceDetail = '/manager/attendance/:memberId',

  TrainerDashboard = '/trainer',
  TrainerMembers = '/trainer/members',
  TrainerPerformance = '/trainer/performance',
}

export const withParams = (path: string, params: Record<string, string>) =>
  Object.entries(params).reduce((acc, [key, value]) => acc.replace(`:${key}`, value), path)
