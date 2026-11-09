import { http, HttpResponse } from 'msw'
import { activityRows, adminProfile, directoryRows, discountMembers, gymSettings, ledgerData, memberAttendance, memberRows, plans } from './fixtures'

const base = 'http://localhost:54321'

/** Fees recorded through the mocked collect_fee RPC, so tests can assert the request. */
/** Ranges requested through the mocked ledger RPC. */
export const ledgerRequests: { p_from: string | null; p_to: string | null }[] = []

/** Member edits sent through the mocked update_member RPC. */
export const updatedMembers: Record<string, string | null>[] = []

export const collectedFees: { p_member_id: string; p_amount: number; p_payment_method: string }[] = []

/** Supabase REST/RPC/auth handlers shared by tests and the optional dev mock mode. */
export const handlers = [
  http.post(`${base}/auth/v1/token`, () =>
    HttpResponse.json({
      access_token: 'token', token_type: 'bearer', expires_in: 3600, refresh_token: 'refresh',
      user: { id: adminProfile.id, email: adminProfile.email, aud: 'authenticated' },
    }),
  ),
  http.get(`${base}/auth/v1/user`, () => HttpResponse.json({ id: adminProfile.id, email: adminProfile.email })),
  http.get(`${base}/rest/v1/profiles`, () => HttpResponse.json(adminProfile)),
  http.get(`${base}/rest/v1/plans`, () => HttpResponse.json(plans)),
  http.post(`${base}/rest/v1/rpc/list_members`, async ({ request }) => {
    const body = (await request.json()) as { p_search?: string | null }
    const search = (body.p_search ?? '').toLowerCase()
    const rows = memberRows.filter((r) => r.full_name.toLowerCase().includes(search))
    return HttpResponse.json({
      total: rows.length,
      kpis: { total: rows.length, active: rows.filter((r) => r.status === 'ACTIVE').length, expired: rows.filter((r) => r.status === 'EXPIRED').length, frozen: 0 },
      rows,
    })
  }),
  http.post(`${base}/rest/v1/rpc/list_activity`, async ({ request }) => {
    const body = (await request.json()) as { p_kind?: string | null; p_search?: string | null }
    const search = (body.p_search ?? '').toLowerCase()
    const matching = activityRows.filter((r) => (r.name ?? '').toLowerCase().includes(search))
    const rows = matching.filter((r) => !body.p_kind || r.kind === body.p_kind)
    const count = (kind: string) => matching.filter((r) => r.kind === kind).length
    return HttpResponse.json({
      rows, total: rows.length,
      counts: { all: matching.length, onboarded: count('ONBOARDED'), granted: count('GRANTED'), denied: count('DENIED') },
    })
  }),
  http.post(`${base}/rest/v1/rpc/gym_directory`, async ({ request }) => {
    const body = (await request.json()) as { p_search?: string | null }
    const search = (body.p_search ?? '').toLowerCase()
    const rows = directoryRows.filter((r) => r.full_name.toLowerCase().includes(search))
    return HttpResponse.json({ rows, total: rows.length })
  }),
  http.post(`${base}/rest/v1/rpc/ledger`, async ({ request }) => {
    ledgerRequests.push((await request.json()) as { p_from: string | null; p_to: string | null })
    return HttpResponse.json(ledgerData)
  }),
  http.post(`${base}/rest/v1/rpc/update_member`, async ({ request }) => {
    updatedMembers.push((await request.json()) as Record<string, string | null>)
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${base}/rest/v1/rpc/collect_fee`, async ({ request }) => {
    collectedFees.push((await request.json()) as { p_member_id: string; p_amount: number; p_payment_method: string })
    return HttpResponse.json('payment-1')
  }),
  http.post(`${base}/rest/v1/rpc/bridge_overview`, () =>
    HttpResponse.json({ online: false, server_time: '2026-04-10T10:00:00Z', last_seen_at: '2026-04-10T09:00:00Z', device_users: 42, device_records: 900 }),
  ),
  http.post(`${base}/rest/v1/rpc/member_attendance`, () => HttpResponse.json(memberAttendance)),
  http.post(`${base}/rest/v1/rpc/attendance_overview`, () =>
    HttpResponse.json({
      total: 1,
      rows: [{ id: 'member-1', full_name: 'Ali Raza', fingerprint_id: '12', registration_date: '2026-02-17', status: 'ACTIVE', days_attended: 3, last_visit: '2026-03-03T05:00:00Z' }],
    }),
  ),
  http.get(`${base}/rest/v1/gym_settings`, () => HttpResponse.json(gymSettings)),
  http.get(`${base}/rest/v1/members`, ({ request }) => {
    const only = new URL(request.url).searchParams.get('monthly_discount')
    const rows = only ? discountMembers.filter((m) => m.monthly_discount > 0) : discountMembers
    return HttpResponse.json(rows, { headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` } })
  }),
  http.post(`${base}/rest/v1/rpc/create_plan`, () => HttpResponse.json('QUARTERLY')),
  http.post(`${base}/rest/v1/rpc/update_plan`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${base}/rest/v1/rpc/set_member_discount`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${base}/rest/v1/rpc/update_my_profile`, () => new HttpResponse(null, { status: 204 })),
]
