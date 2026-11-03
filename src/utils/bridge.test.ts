import { describe, expect, it } from 'vitest'
import { clockOffset, isBridgeOnline } from './bridge'

describe('isBridgeOnline', () => {
  const now = Date.parse('2026-04-10T10:00:00Z')

  it('is online when the last heartbeat is under 30 seconds old', () => {
    expect(isBridgeOnline('2026-04-10T09:59:45Z', now)).toBe(true)
  })

  it('is offline from 30 seconds without a heartbeat', () => {
    expect(isBridgeOnline('2026-04-10T09:59:30Z', now)).toBe(false)
  })

  it('is offline when it never reported', () => {
    expect(isBridgeOnline(undefined, now)).toBe(false)
    expect(isBridgeOnline(null, now)).toBe(false)
  })

  it('uses the server clock offset so a wrong laptop clock does not matter', () => {
    // browser clock runs 10 minutes behind the server
    const offset = clockOffset('2026-04-10T10:00:00Z', Date.parse('2026-04-10T09:50:00Z'))
    expect(offset).toBe(10 * 60 * 1000)
    expect(isBridgeOnline('2026-04-10T09:59:50Z', Date.parse('2026-04-10T09:50:05Z'), offset)).toBe(true)
  })
})
