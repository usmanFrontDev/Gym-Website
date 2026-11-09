import { EdgeFunction, Rpc, Table } from '@/constants/tables'
import { Role } from '@/constants/roles'
import type { ExpenseCategoryValue, ExpenseRow, ExpenseSummary, LedgerData, ManagerRow, PayoutRow, RevenueSummary, StaffCredentials, TrainerRow } from '@/types/superAdmin/admin.types'
import { AppError } from '../appError'
import { supabase, unwrap } from '../supabase-client'

export interface CreateStaffInput {
  role: Role.MANAGER | Role.TRAINER
  full_name: string
  father_name: string
  cnic: string
  phone: string
  address: string
  email: string
  password: string
  trainer_type?: string
  fingerprint_id: string
}

async function callStaffFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(EdgeFunction.ManageStaff, { body })
  if (error) {
    const response = (error as { context?: Response }).context
    const detail = response ? ((await response.json().catch(() => null)) as { message?: string } | null) : null
    throw new AppError(detail?.message ?? error.message)
  }
  return data as T
}

export const adminService = {
  async revenueSummary(): Promise<RevenueSummary> {
    return unwrap(await supabase.rpc(Rpc.RevenueSummary)) as RevenueSummary
  },
  async managers(): Promise<ManagerRow[]> {
    return unwrap(await supabase.rpc(Rpc.ManagersOverview)) as ManagerRow[]
  },
  async trainers(): Promise<TrainerRow[]> {
    return unwrap(await supabase.rpc(Rpc.TrainersOverview)) as TrainerRow[]
  },
  async manager(managerId: string): Promise<ManagerRow | null> {
    const rows = unwrap(await supabase.rpc(Rpc.ManagersOverview)) as ManagerRow[]
    return rows.find((r) => r.id === managerId) ?? null
  },

  createStaff: (input: CreateStaffInput) => callStaffFunction<StaffCredentials>({ action: 'create', ...input, password: input.password || undefined }),
  setBlocked: (id: string, blocked: boolean) => callStaffFunction<{ ok: true }>({ action: blocked ? 'block' : 'unblock', id }),
  softDelete: (id: string) => callStaffFunction<{ ok: true }>({ action: 'delete', id }),
  resetPassword: (id: string) => callStaffFunction<StaffCredentials>({ action: 'reset-password', id }),

  async payouts(trainerId: string): Promise<PayoutRow[]> {
    return unwrap(
      await supabase.from(Table.TrainerPayouts).select('id, amount, paid_on, note').eq('trainer_id', trainerId).order('paid_on', { ascending: false }),
    ) as PayoutRow[]
  },
  async addPayout(trainerId: string, amount: number, note: string, adminId: string): Promise<void> {
    unwrap(await supabase.from(Table.TrainerPayouts).insert({ trainer_id: trainerId, amount, note: note || null, created_by: adminId }))
  },

  async expenses(from: string, to: string): Promise<ExpenseRow[]> {
    return unwrap(
      await supabase.from(Table.Expenses).select('id, category, amount, spent_on, note').gte('spent_on', from).lte('spent_on', to).order('spent_on', { ascending: false }),
    ) as ExpenseRow[]
  },
  async ledger(from: string | null, to: string | null): Promise<LedgerData> {
    return unwrap(await supabase.rpc(Rpc.Ledger, { p_from: from, p_to: to })) as LedgerData
  },
  async expenseSummary(from: string, to: string): Promise<ExpenseSummary> {
    return unwrap(await supabase.rpc(Rpc.ExpenseSummary, { p_from: from, p_to: to })) as ExpenseSummary
  },
  async addExpense(input: { category: ExpenseCategoryValue; amount: number; spent_on: string; note: string }, adminId: string): Promise<void> {
    unwrap(await supabase.from(Table.Expenses).insert({ ...input, note: input.note || null, created_by: adminId }))
  },
  async deleteExpense(id: string): Promise<void> {
    unwrap(await supabase.from(Table.Expenses).delete().eq('id', id))
  },
}
