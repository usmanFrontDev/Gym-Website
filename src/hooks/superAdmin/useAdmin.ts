import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { QueryKey } from '@/constants/queryKeys'
import { adminService, type CreateStaffInput } from '@/services/superAdmin/adminService'
import { useAuthStore } from '@/stores/authStore'
import type { ExpenseCategoryValue } from '@/types/superAdmin/admin.types'

export function useRevenueSummary() {
  return useQuery({ queryKey: [QueryKey.RevenueSummary], queryFn: adminService.revenueSummary })
}
export function useManagers() {
  return useQuery({ queryKey: [QueryKey.Managers], queryFn: adminService.managers })
}
export function useManager(managerId: string) {
  return useQuery({ queryKey: [QueryKey.Manager, managerId], queryFn: () => adminService.manager(managerId) })
}
export function useTrainers() {
  return useQuery({ queryKey: [QueryKey.Trainers], queryFn: adminService.trainers })
}
export function usePayouts(trainerId: string | null) {
  return useQuery({
    queryKey: [QueryKey.Payouts, trainerId],
    queryFn: () => adminService.payouts(trainerId as string),
    enabled: trainerId !== null,
  })
}
export function useExpenses(from: string, to: string) {
  return useQuery({ queryKey: [QueryKey.Expenses, from, to], queryFn: () => adminService.expenses(from, to) })
}
export function useExpenseSummary(from: string, to: string) {
  return useQuery({ queryKey: [QueryKey.ExpenseSummary, from, to], queryFn: () => adminService.expenseSummary(from, to) })
}

function useStaffInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    for (const key of [QueryKey.Managers, QueryKey.Manager, QueryKey.Trainers]) queryClient.invalidateQueries({ queryKey: [key] })
  }
}

export function useCreateStaff() {
  const invalidate = useStaffInvalidation()
  return useMutation({
    mutationFn: (input: CreateStaffInput) => adminService.createStaff(input),
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  })
}
export function useSetBlocked() {
  const invalidate = useStaffInvalidation()
  return useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => adminService.setBlocked(id, blocked),
    onSuccess: (_d, v) => {
      toast.success(v.blocked ? 'User blocked' : 'User unblocked')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}
export function useDeleteStaff() {
  const invalidate = useStaffInvalidation()
  return useMutation({
    mutationFn: adminService.softDelete,
    onSuccess: () => {
      toast.success('User deleted (history kept)')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}
export function useResetPassword() {
  return useMutation({ mutationFn: adminService.resetPassword, onError: (e) => toast.error(e.message) })
}

export function useAddPayout() {
  const queryClient = useQueryClient()
  const adminId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: ({ trainerId, amount, note }: { trainerId: string; amount: number; note: string }) =>
      adminService.addPayout(trainerId, amount, note, adminId as string),
    onSuccess: () => {
      toast.success('Payout recorded')
      queryClient.invalidateQueries({ queryKey: [QueryKey.Payouts] })
      queryClient.invalidateQueries({ queryKey: [QueryKey.Trainers] })
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useAddExpense() {
  const queryClient = useQueryClient()
  const adminId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: (input: { category: ExpenseCategoryValue; amount: number; spent_on: string; note: string }) =>
      adminService.addExpense(input, adminId as string),
    onSuccess: () => {
      toast.success('Expense recorded')
      queryClient.invalidateQueries({ queryKey: [QueryKey.Expenses] })
      queryClient.invalidateQueries({ queryKey: [QueryKey.ExpenseSummary] })
      queryClient.invalidateQueries({ queryKey: [QueryKey.RevenueSummary] })
    },
    onError: (e) => toast.error(e.message),
  })
}
export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminService.deleteExpense,
    onSuccess: () => {
      toast.success('Expense deleted')
      queryClient.invalidateQueries({ queryKey: [QueryKey.Expenses] })
      queryClient.invalidateQueries({ queryKey: [QueryKey.ExpenseSummary] })
      queryClient.invalidateQueries({ queryKey: [QueryKey.RevenueSummary] })
    },
    onError: (e) => toast.error(e.message),
  })
}
