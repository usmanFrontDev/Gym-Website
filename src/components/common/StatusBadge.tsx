import { strings } from '@/constants/strings'
import { Badge } from './Badge'

export type MemberStatusValue = keyof typeof strings.status

const tones = {
  ACTIVE: 'success',
  EXPIRED: 'danger',
  FROZEN: 'warning',
  BLOCKED: 'danger',
  UNKNOWN: 'neutral',
  STAFF: 'primary',
} as const

export function StatusBadge({ status }: { status: MemberStatusValue }) {
  return <Badge tone={tones[status]}>{strings.status[status]}</Badge>
}
