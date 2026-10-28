import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { QueryKey } from '@/constants/queryKeys'
import { enrollmentService } from '@/services/common/enrollmentService'
import type { EnrollmentStatus } from '@/types/common/enrollment.types'

const POLL_MS = 1500
export const FINISHED: EnrollmentStatus[] = ['SUCCESS', 'FAILED', 'CANCELLED']

export function useStartEnrollment() {
  return useMutation({ mutationFn: enrollmentService.start, onError: (e) => toast.error(e.message) })
}

export function useCancelEnrollment() {
  return useMutation({ mutationFn: enrollmentService.cancel, onError: (e) => toast.error(e.message) })
}

/** Polls the scan until the bridge reports a final state. */
export function useEnrollment(id: string | null) {
  return useQuery({
    queryKey: [QueryKey.DeviceEnrollment, id],
    queryFn: () => enrollmentService.get(id ?? ''),
    enabled: id !== null,
    refetchInterval: (query) => (query.state.data && FINISHED.includes(query.state.data.status) ? false : POLL_MS),
  })
}
