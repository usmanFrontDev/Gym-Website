// Reads ZKTeco K50 punches and writes them to Supabase via the log_punch RPC.
// The RPC evaluates member status (ACTIVE/EXPIRED/FROZEN/BLOCKED/UNKNOWN/STAFF) server-side.
import { createClient } from '@supabase/supabase-js'
import ZKLib from 'node-zklib'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ZK_IP, ZK_PORT = '4370' } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ZK_IP) {
  process.stderr.write('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ZK_IP (see .env.example)\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function handlePunch(log) {
  const { error } = await supabase.rpc('log_punch', {
    p_fingerprint_id: String(log.userId),
    p_punched_at: new Date(log.attTime ?? Date.now()).toISOString(),
  })
  if (error) process.stderr.write(`log_punch failed: ${error.message}\n`)
}

async function run() {
  const device = new ZKLib(ZK_IP, Number(ZK_PORT), 10000, 4000)
  await device.createSocket()
  await device.getRealTimeLogs(handlePunch)
  process.stdout.write('Bridge connected, waiting for punches\n')
}

// Reconnect forever: the laptop stays on all day.
for (;;) {
  try {
    await run()
    await new Promise(() => {})
  } catch (error) {
    process.stderr.write(`Bridge error: ${error instanceof Error ? error.message : error}. Retrying in 10s\n`)
    await new Promise((r) => setTimeout(r, 10000))
  }
}
