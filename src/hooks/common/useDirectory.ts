import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { directoryStrings } from '@/constants/strings'
import { QueryKey } from '@/constants/queryKeys'
import { directoryService } from '@/services/common/directoryService'

export function useDirectory(search: string, page: number) {
  return useQuery({
    queryKey: [QueryKey.GymDirectory, search, page],
    queryFn: () => directoryService.search(search, page),
    placeholderData: keepPreviousData,
  })
}

export function useCollectFee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, amount }: { memberId: string; amount: number }) => directoryService.collectFee(memberId, amount),
    onSuccess: () => {
      toast.success(directoryStrings.collect.success)
      ;[QueryKey.GymDirectory, QueryKey.Members, QueryKey.Member, QueryKey.MemberPayments, QueryKey.ManagerStats, QueryKey.RevenueSummary].forEach(
        (key) => queryClient.invalidateQueries({ queryKey: [key] }),
      )
    },
    onError: (e) => toast.error(e.message),
  })
}
