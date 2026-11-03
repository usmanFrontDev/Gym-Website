export const BRIDGE_TIMEOUT_MS = 30_000

/** Server time minus browser time, measured when the status was fetched. */
export function clockOffset(serverTime: string, clientNowMs: number): number {
  return Date.parse(serverTime) - clientNowMs
}

/** The bridge is online while its last heartbeat is younger than the timeout. `nowMs` is passed in. */
export function isBridgeOnline(lastSeenAt: string | null | undefined, nowMs: number, offsetMs = 0): boolean {
  if (!lastSeenAt) return false
  return nowMs + offsetMs - Date.parse(lastSeenAt) < BRIDGE_TIMEOUT_MS
}
