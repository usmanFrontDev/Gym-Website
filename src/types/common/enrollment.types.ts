export type EnrollmentStatus = 'PENDING' | 'ENROLLING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

/** A fingerprint scan queued by the app and run on the K50 by the reception bridge. */
export interface DeviceEnrollment {
  id: string
  status: EnrollmentStatus
  fingerprint_id: string | null
  error: string | null
}
