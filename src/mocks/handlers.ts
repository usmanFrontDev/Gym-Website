import { http, HttpResponse } from 'msw'
import { adminProfile, memberRows, plans } from './fixtures'

const base = 'http://localhost:54321'

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
]
