import type { MemberStatusValue } from '@/components/common/StatusBadge'

export interface AlertSpec {
  sound: 'beep' | 'buzzer'
  message: string | null
}

/** Everything except ACTIVE and staff is a buzzer. There is no separate warning state. */
export function alertForStatus(status: MemberStatusValue): AlertSpec {
  switch (status) {
    case 'ACTIVE':
    case 'STAFF':
      return { sound: 'beep', message: null }
    case 'FROZEN':
      return { sound: 'buzzer', message: 'Your membership is frozen' }
    case 'UNKNOWN':
      return { sound: 'buzzer', message: 'Fingerprint not recognised' }
    default:
      return { sound: 'buzzer', message: 'Your fees is not paid' }
  }
}
