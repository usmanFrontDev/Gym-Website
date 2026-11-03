import type { MemberStatusValue } from '@/components/common/StatusBadge'

/** What the device decided (or what happened): a granted or denied punch, or a member being onboarded. */
export type ActivityKind = 'ONBOARDED' | 'GRANTED' | 'DENIED'

export interface ActivityRow {
  id: string
  at: string
  fingerprint_id: string | null
  /** Punch status, or 'ONBOARDED' for a registration. */
  status: MemberStatusValue | 'ONBOARDED'
  kind: ActivityKind
  name: string | null
  member_id: string | null
}

export interface ActivityCounts {
  all: number
  onboarded: number
  granted: number
  denied: number
}

export interface ActivityPage {
  rows: ActivityRow[]
  total: number
  counts: ActivityCounts
}

export interface ActivityFilters {
  page: number
  kind: ActivityKind | ''
  search: string
}

export interface BridgeOverview {
  online: boolean
  server_time: string
  device_ip?: string | null
  bridge_version?: string | null
  started_at?: string | null
  last_seen_at?: string
  last_sync_at?: string | null
  last_punch_at?: string | null
  last_punch_fingerprint_id?: string | null
  device_users?: number | null
  device_fingerprints?: number | null
  device_records?: number | null
  last_enrollment_at?: string | null
  last_enrollment_status?: string | null
  last_error?: string | null
  last_error_at?: string | null
}
