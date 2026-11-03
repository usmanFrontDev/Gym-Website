import { alertForStatus } from './alerts'
import type { MemberStatusValue } from '@/components/common/StatusBadge'

let context: AudioContext | null = null

/** Must be called from a click: browsers block audio until the user interacts. */
export function enableAlertSound(): boolean {
  try {
    context = context ?? new AudioContext()
    void context.resume()
    return true
  } catch {
    return false
  }
}

function tone(frequency: number, durationSec: number, type: OscillatorType, volume: number) {
  if (!context) return
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = volume * 0.35
  osc.connect(gain).connect(context.destination)
  osc.start()
  osc.stop(context.currentTime + durationSec)
}

export interface AlertOptions {
  /** Speak the message after the buzzer. */
  speech?: boolean
  /** 0.1 to 1 */
  volume?: number
}

export function playAlert(status: MemberStatusValue, { speech = true, volume = 0.6 }: AlertOptions = {}) {
  if (!context) return
  const { sound, message } = alertForStatus(status)
  if (sound === 'beep') return tone(880, 0.15, 'sine', volume)
  tone(180, 1.2, 'sawtooth', volume)
  if (speech && message && 'speechSynthesis' in window) {
    window.setTimeout(() => window.speechSynthesis.speak(new SpeechSynthesisUtterance(message)), 1000)
  }
}
