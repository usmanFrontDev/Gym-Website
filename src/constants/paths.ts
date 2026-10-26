export enum Path {
  Root = '/',
  Login = '/login',
  Forbidden = '/forbidden',
  Profile = '/profile',

  AdminDashboard = '/admin',
  AdminMembers = '/admin/members',
  AdminMemberNew = '/admin/members/new',
  AdminMemberDetail = '/admin/members/:memberId',
  AdminManagers = '/admin/managers',
  AdminManagerDetail = '/admin/managers/:managerId',
  AdminTrainers = '/admin/trainers',
  AdminExpenses = '/admin/expenses',

  ManagerDashboard = '/manager',
  ManagerStats = '/manager/stats',
  ManagerMembers = '/manager/members',
  ManagerMemberNew = '/manager/members/new',
  ManagerMemberDetail = '/manager/members/:memberId',

  TrainerDashboard = '/trainer',
  TrainerMembers = '/trainer/members',
  TrainerPerformance = '/trainer/performance',
}

export const withParams = (path: string, params: Record<string, string>) =>
  Object.entries(params).reduce((acc, [key, value]) => acc.replace(`:${key}`, value), path)
