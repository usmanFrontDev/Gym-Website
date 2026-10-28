// Reception bridge for the ZKTeco K50. Runs on the reception laptop with the service-role key.
//  - Punches: realtime events go straight to the log_punch RPC (which evaluates member status). This K50
//    only streams them after capture is reset, verify mode started and the device enabled. The device's
//    record count is also polled, so punches missed by realtime (or made while the bridge was off) are
//    caught up from the full log.
//  - Enrollment: runs fingerprint scans the app queues in device_enrollments, picks the device user ID
//    and reports the result back on the same row.
import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import ZKLibTCP from 'node-zklib/zklibtcp.js'
import constants from 'node-zklib/constants.js'
import utils from 'node-zklib/utils.js'

const { COMMANDS } = constants
const { createTCPHeader, decodeRecordRealTimeLog52 } = utils
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ZK_IP, ZK_PORT = '4370' } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ZK_IP) {
  process.stderr.write('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ZK_IP (see .env.example)\n')
  process.exit(1)
}

const POLL_MS = 3000
const ENROLL_TIMEOUT_MS = 90_000
const REQUEST_TTL_MS = 120_000
const STATE_FILE = new URL('./.bridge-state.json', import.meta.url)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (msg) => process.stdout.write(`${new Date().toLocaleTimeString()} ${msg}\n`)
const ok = (reply) => reply?.length >= 2 && reply.readUInt16LE(0) === COMMANDS.CMD_ACK_OK

class EnrollError extends Error {}

let device = null

async function connectDevice() {
  const zk = new ZKLibTCP(ZK_IP, Number(ZK_PORT), 10000)
  await zk.createSocket()
  await zk.connect()
  zk.socket.on('data', onDeviceData)
  return zk
}

/** Puts the device back in normal verify mode and subscribes to attendance events. */
async function armRealtime() {
  await device.executeCmd(COMMANDS.CMD_CANCELCAPTURE, '')
  await device.executeCmd(COMMANDS.CMD_STARTVERIFY, '')
  await device.executeCmd(COMMANDS.CMD_ENABLEDEVICE, '')
  const flags = Buffer.alloc(4)
  flags.writeUInt32LE(COMMANDS.EF_ATTLOG, 0)
  if (!ok(await device.executeCmd(COMMANDS.CMD_REG_EVENT, flags))) throw new Error('The scanner refused realtime punches')
}

async function deviceSizes() {
  const reply = await device.executeCmd(COMMANDS.CMD_GET_FREE_SIZES, '')
  // A realtime event can land on a command's reply slot; reconnecting resyncs cleanly.
  if (!ok(reply)) throw new Error('Unexpected reply from the scanner')
  const p = reply.subarray(8)
  return { fingers: p.readInt32LE(24), records: p.readInt32LE(32) }
}

// ---------- punches ----------

/** Number of device records already sent; persisted so punches made while the bridge was off are not lost. */
function loadSyncedCount() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')).syncedRecords ?? null
  } catch {
    return null
  }
}
let syncedRecords = loadSyncedCount()

function saveSyncedCount(n) {
  syncedRecords = n
  writeFileSync(STATE_FILE, JSON.stringify({ syncedRecords: n }))
}

async function sendPunch(userId, punchedAt) {
  const { error } = await supabase.rpc('log_punch', {
    p_fingerprint_id: String(userId),
    p_punched_at: punchedAt.toISOString(),
  })
  if (error) throw new Error(`log_punch failed: ${error.message}`)
  if (syncedRecords !== null) saveSyncedCount(syncedRecords + 1)
  log(`punch: device user ${userId}`)
}

/** Realtime punches are sent one at a time, in order. */
let punchChain = Promise.resolve()

function onDeviceData(data) {
  if (data.length <= 16 || data.readUInt16LE(8) !== COMMANDS.CMD_REG_EVENT || data.readUInt16LE(12) !== COMMANDS.EF_ATTLOG) return
  device.socket.write(createTCPHeader(COMMANDS.CMD_ACK_OK, device.sessionId, 65534, ''))
  const { userId, attTime } = decodeRecordRealTimeLog52(data)
  punchChain = punchChain.then(() => sendPunch(userId, attTime)).catch((e) => log(e.message))
}

/** Set when the device has more records than were sent; a full read only runs if the gap survives one poll. */
let gapSeen = false

async function syncPunches() {
  await punchChain
  const { records } = await deviceSizes()
  // First run, or the device log was cleared: start counting from now.
  if (syncedRecords === null || records < syncedRecords) {
    gapSeen = false
    return saveSyncedCount(records)
  }
  if (records === syncedRecords) {
    gapSeen = false
    return
  }
  // A realtime event for this record may still be in flight.
  if (!gapSeen) {
    gapSeen = true
    return
  }
  gapSeen = false
  const { data } = await device.getAttendances()
  for (const rec of data.slice(syncedRecords)) await sendPunch(rec.deviceUserId, new Date(rec.recordTime))
}

// ---------- enrollment ----------

const setEnrollment = (id, fields) =>
  supabase.from('device_enrollments').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)

/** Claims the oldest waiting scan. Requests nobody picked up in time are expired first. */
async function claimEnrollment() {
  await supabase
    .from('device_enrollments')
    .update({ status: 'FAILED', error: 'The scanner did not pick up the request in time', updated_at: new Date().toISOString() })
    .eq('status', 'PENDING')
    .lt('created_at', new Date(Date.now() - REQUEST_TTL_MS).toISOString())

  const { data: next } = await supabase
    .from('device_enrollments').select('id').eq('status', 'PENDING').order('created_at').limit(1)
  if (!next?.length) return null
  const { data: claimed } = await supabase
    .from('device_enrollments')
    .update({ status: 'ENROLLING', updated_at: new Date().toISOString() })
    .eq('id', next[0].id).eq('status', 'PENDING')
    .select('id').maybeSingle()
  return claimed
}

async function isCancelled(id) {
  const { data } = await supabase.from('device_enrollments').select('status').eq('id', id).single()
  return data?.status === 'CANCELLED'
}

/** Next free numeric ID across the device and the database. */
async function nextFingerprintId(deviceUsers) {
  const [members, staff] = await Promise.all([
    supabase.from('members').select('fingerprint_id').not('fingerprint_id', 'is', null),
    supabase.from('profiles').select('fingerprint_id').not('fingerprint_id', 'is', null),
  ])
  if (members.error || staff.error) throw new Error('Could not read existing fingerprint IDs')
  const ids = [...deviceUsers.map((u) => u.userId), ...members.data.map((m) => m.fingerprint_id), ...staff.data.map((s) => s.fingerprint_id)]
  return String(Math.max(0, ...ids.map(Number).filter(Number.isInteger)) + 1)
}

/** 72-byte user record (<HB8s24sIx7sx24s): uid, privilege, password, name, card, group, user id. */
function userRecord(uid, userId) {
  const rec = Buffer.alloc(72)
  rec.writeUInt16LE(uid, 0)
  rec.write(userId, 48, 'ascii')
  return rec
}

async function deleteDeviceUser(uid) {
  const d = Buffer.alloc(2)
  d.writeUInt16LE(uid, 0)
  await device.executeCmd(COMMANDS.CMD_DELETE_USER, d)
  await device.executeCmd(COMMANDS.CMD_REFRESHDATA, '')
}

async function runEnrollment(id) {
  const { data: users } = await device.getUsers()
  const fingerprintId = await nextFingerprintId(users)
  const uid = Math.max(0, ...users.map((u) => u.uid)) + 1
  const { fingers: before } = await deviceSizes()

  if (!ok(await device.executeCmd(COMMANDS.CMD_USER_WRQ, userRecord(uid, fingerprintId)))) {
    await setEnrollment(id, { status: 'FAILED', error: 'The scanner refused to create the user' })
    return
  }
  await device.executeCmd(COMMANDS.CMD_REFRESHDATA, '')
  log(`enroll: started for device user ${fingerprintId}`)

  try {
    await device.executeCmd(COMMANDS.CMD_CANCELCAPTURE, '')
    const payload = Buffer.alloc(26)
    payload.write(fingerprintId, 0, 'ascii')
    payload.writeInt8(0, 24) // finger index
    payload.writeInt8(1, 25)
    if (!ok(await device.executeCmd(COMMANDS.CMD_STARTENROLL, payload))) throw new EnrollError('The scanner did not enter enroll mode')

    // The device finishes the 3 scans on its own; a new stored template means success.
    const deadline = Date.now() + ENROLL_TIMEOUT_MS
    for (;;) {
      await sleep(2000)
      if ((await deviceSizes()).fingers > before) break
      if (await isCancelled(id)) throw new EnrollError(null)
      if (Date.now() > deadline) {
        throw new EnrollError('No new fingerprint was saved within 90 seconds (no finger scanned, or it is already enrolled)')
      }
    }
    await device.executeCmd(COMMANDS.CMD_STARTVERIFY, '').catch(() => {})
    await setEnrollment(id, { status: 'SUCCESS', fingerprint_id: fingerprintId })
    log(`enroll: success, device user ${fingerprintId}`)
  } catch (error) {
    await device.executeCmd(COMMANDS.CMD_CANCELCAPTURE, '').catch(() => {})
    await deleteDeviceUser(uid).catch(() => {})
    await device.executeCmd(COMMANDS.CMD_STARTVERIFY, '').catch(() => {})
    if (!(error instanceof EnrollError)) {
      await setEnrollment(id, { status: 'FAILED', error: 'Lost the connection to the scanner' })
      throw error
    }
    if (error.message) await setEnrollment(id, { status: 'FAILED', error: error.message })
    log(`enroll: ${error.message ?? 'cancelled'}`)
  }
}

// ---------- main loop: reconnect forever, the laptop stays on all day ----------

for (;;) {
  try {
    device = await connectDevice()
    await armRealtime()
    log('Bridge connected, waiting for punches and scan requests')
    for (;;) {
      const request = await claimEnrollment().catch((e) => log(`enroll queue error: ${e.message}`))
      if (request) {
        await runEnrollment(request.id)
        await armRealtime()
      }
      await syncPunches()
      await sleep(POLL_MS)
    }
  } catch (error) {
    process.stderr.write(`Bridge error: ${error instanceof Error ? error.message : error}. Retrying in 10s\n`)
    await device?.disconnect().catch(() => {})
    device = null
    await sleep(10000)
  }
}
