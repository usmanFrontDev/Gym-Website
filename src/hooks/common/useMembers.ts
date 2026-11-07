import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { QueryKey } from '@/constants/queryKeys'
import { memberService } from '@/services/common/memberService'
import type { MembersFilters } from '@/types/common/member.types'

export function useMembers(filters: MembersFilters) {
  return useQuery({
    queryKey: [QueryKey.Members, filters],
    queryFn: () => memberService.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function usePlans() {
  return useQuery({ queryKey: [QueryKey.Plans], queryFn: memberService.plans, staleTime: Infinity })
}

export function useMember(memberId: string) {
  return useQuery({ queryKey: [QueryKey.Member, memberId], queryFn: () => memberService.detail(memberId) })
}

export function useMemberPayments(memberId: string) {
  return useQuery({ queryKey: [QueryKey.MemberPayments, memberId], queryFn: () => memberService.payments(memberId) })
}

export function useMemberFreezes(memberId: string) {
  return useQuery({ queryKey: [QueryKey.MemberFreezes, memberId], queryFn: () => memberService.freezes(memberId) })
}

export function useMemberAssignments(memberId: string) {
  return useQuery({ queryKey: [QueryKey.MemberAssignments, memberId], queryFn: () => memberService.assignments(memberId) })
}

/** Billing changes touch many cached views, so they all invalidate together. */
function useBillingInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    Object.values([
      QueryKey.Members, QueryKey.Member, QueryKey.MemberPayments, QueryKey.MemberFreezes, QueryKey.MemberAssignments,
      QueryKey.RevenueSummary, QueryKey.ManagerStats, QueryKey.TrainerStats, QueryKey.Managers, QueryKey.Trainers,
    ]).forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
  }
}

export function useRegisterMember() {
  const invalidate = useBillingInvalidation()
  return useMutation({
    mutationFn: memberService.register,
    onSuccess: () => {
      toast.success('Member registered')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useRecordPayment() {
  const invalidate = useBillingInvalidation()
  return useMutation({
    mutationFn: memberService.recordPayment,
    onSuccess: () => {
      toast.success('Payment recorded')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useVoidPayment() {
  const invalidate = useBillingInvalidation()
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) => memberService.voidPayment(paymentId, reason),
    onSuccess: () => {
      toast.success('Payment voided')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useFreezeMember() {
  const invalidate = useBillingInvalidation()
  return useMutation({
    mutationFn: memberService.freeze,
    onSuccess: () => {
      toast.success('Member frozen')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useResumeMember() {
  const invalidate = useBillingInvalidation()
  return useMutation({
    mutationFn: memberService.resume,
    onSuccess: () => {
      toast.success('Member resumed')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteMember() {
  const invalidate = useBillingInvalidation()
  return useMutation({
    mutationFn: memberService.remove,
    onSuccess: () => {
      toast.success('Member deleted')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useAssignTrainer() {
  const invalidate = useBillingInvalidation()
  return useMutation({
    mutationFn: ({ memberId, trainerId, commission }: { memberId: string; trainerId: string | null; commission: number }) =>
      memberService.assignTrainer(memberId, trainerId, commission),
    onSuccess: () => {
      toast.success('Trainer updated')
      invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
}
