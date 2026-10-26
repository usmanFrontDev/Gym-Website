import { describe, expect, it } from 'vitest'
import { alertForStatus } from './alerts'

describe('alertForStatus', () => {
  it('active members get a short beep and no speech', () => {
    expect(alertForStatus('ACTIVE')).toEqual({ sound: 'beep', message: null })
  })
  it('staff punches get a beep', () => {
    expect(alertForStatus('STAFF').sound).toBe('beep')
  })
  it('expired, unpaid and blocked get the buzzer with the fees message', () => {
    expect(alertForStatus('EXPIRED')).toEqual({ sound: 'buzzer', message: 'Your fees is not paid' })
    expect(alertForStatus('BLOCKED')).toEqual({ sound: 'buzzer', message: 'Your fees is not paid' })
  })
  it('frozen and unknown get their own wording', () => {
    expect(alertForStatus('FROZEN').message).toBe('Your membership is frozen')
    expect(alertForStatus('UNKNOWN').message).toBe('Fingerprint not recognised')
  })
})
