// Staff management. Runs with the service-role key (never shipped to the browser).
// Only a signed-in, non-blocked SUPER_ADMIN may call it.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('') + '#9'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })

  const { data: userData } = await caller.auth.getUser()
  if (!userData.user) return json({ message: 'Not signed in' }, 401)
  const { data: me } = await admin.from('profiles').select('role, blocked, deleted_at').eq('id', userData.user.id).single()
  if (!me || me.role !== 'SUPER_ADMIN' || me.blocked || me.deleted_at) return json({ message: 'Not allowed' }, 403)

  const body = await req.json()
  const action: string = body.action

  if (action === 'create') {
    const { role, full_name, father_name, cnic, phone, address, email, trainer_type, fingerprint_id } = body
    if (role !== 'MANAGER' && role !== 'TRAINER') return json({ message: 'Invalid role' }, 400)
    const password: string = body.password || generatePassword()
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error || !data.user) return json({ message: error?.message ?? 'Could not create user' }, 400)
    const { error: profileError } = await admin.from('profiles').insert({
      id: data.user.id, role, full_name, father_name, cnic, phone, address, email,
      trainer_type: role === 'TRAINER' ? trainer_type : null,
      fingerprint_id: fingerprint_id || null,
      created_by: userData.user.id,
    })
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id)
      return json({ message: profileError.message }, 400)
    }
    return json({ id: data.user.id, password })
  }

  const targetId: string = body.id
  const { data: target } = await admin.from('profiles').select('role').eq('id', targetId).single()
  if (!target || target.role === 'SUPER_ADMIN') return json({ message: 'Invalid target' }, 400)

  if (action === 'block' || action === 'unblock') {
    const blocked = action === 'block'
    await admin.from('profiles').update({ blocked }).eq('id', targetId)
    await admin.auth.admin.updateUserById(targetId, { ban_duration: blocked ? '876000h' : 'none' })
    return json({ ok: true })
  }
  if (action === 'delete') {
    await admin.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', targetId)
    await admin.auth.admin.updateUserById(targetId, { ban_duration: '876000h' })
    return json({ ok: true })
  }
  if (action === 'reset-password') {
    const password = generatePassword()
    const { error } = await admin.auth.admin.updateUserById(targetId, { password })
    if (error) return json({ message: error.message }, 400)
    return json({ password })
  }
  return json({ message: 'Unknown action' }, 400)
})
