export enum Table {
  Profiles = 'profiles',
  Plans = 'plans',
  Members = 'members',
  Memberships = 'memberships',
  Payments = 'payments',
  Freezes = 'freezes',
  TrainerAssignments = 'trainer_assignments',
  TrainerPayouts = 'trainer_payouts',
  AttendanceLogs = 'attendance_logs',
  Expenses = 'expenses',
}

export enum Rpc {
  ListMembers = 'list_members',
  RegisterMember = 'register_member',
  RecordPayment = 'record_payment',
  VoidPayment = 'void_payment',
  FreezeMember = 'freeze_member',
  ResumeMember = 'resume_member',
  AssignTrainer = 'assign_trainer',
  MemberStatus = 'member_status',
  ManagersOverview = 'managers_overview',
  TrainersOverview = 'trainers_overview',
  TrainerMemberCommissions = 'trainer_member_commissions',
  RevenueSummary = 'revenue_summary',
  ManagerStats = 'manager_stats',
  TrainerStats = 'trainer_stats',
  ExpenseSummary = 'expense_summary',
}

export enum EdgeFunction {
  ManageStaff = 'manage-staff',
}
