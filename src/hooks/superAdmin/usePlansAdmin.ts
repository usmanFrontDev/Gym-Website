import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { QueryKey } from '@/constants/queryKeys'
import { planService, type CreatePlanInput, type DiscountMembersFilters, type UpdatePlanInput } from '@/services/superAdmin/planService'

export function useDiscountMembers(filters: DiscountMembersFilters) {
  return useQuery({
    queryKey: [QueryKey.DiscountMembers, filters],
    queryFn: () => planService.discountMembers(filters),
    placeholderData: keepPreviousData,
  })
}

function usePlanInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    for (const key of [QueryKey.Plans, QueryKey.Members, QueryKey.Member, QueryKey.DiscountMembers]) void queryClient.invalidateQueries({ queryKey: [key] })
  }
}

export function useCreatePlan() {
  const invalidate = usePlanInvalidation()
  return useMutation({
    mutationFn: (input: CreatePlanInput) => planService.create(input),
    onSuccess: () => {
      invalidate()
      toast.success('Plan added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdatePlan() {
  const invalidate = usePlanInvalidation()
  return useMutation({
    mutationFn: (input: UpdatePlanInput) => planService.update(input),
    onSuccess: () => {
      invalidate()
      toast.success('Plan updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useSetMemberDiscount() {
  const invalidate = usePlanInvalidation()
  return useMutation({
    mutationFn: ({ memberId, amount }: { memberId: string; amount: number }) => planService.setMemberDiscount(memberId, amount),
    onSuccess: () => {
      invalidate()
      toast.success('Discount saved')
    },
    onError: (error) => toast.error(error.message),
  })
}
