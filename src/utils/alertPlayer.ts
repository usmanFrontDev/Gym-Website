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

function tone(frequency: number, durationSec: number, type: OscillatorType) {
  if (!context) return
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = 0.2
  osc.connect(gain).connect(context.destination)
  osc.start()
  osc.stop(context.currentTime + durationSec)
}

export function playAlert(status: MemberStatusValue) {
  if (!context) return
  const { sound, message } = alertForStatus(status)
  if (sound === 'beep') return tone(880, 0.15, 'sine')
  tone(180, 1.2, 'sawtooth')
  if (message && 'speechSynthesis' in window) {
    window.setTimeout(() => window.speechSynthesis.speak(new SpeechSynthesisUtterance(message)), 1000)
  }
}
