import { describe, expect, it } from 'vitest'
import { formatDate, formatPkr, todayKarachi } from './format'

describe('todayKarachi', () => {
  it('uses Asia/Karachi (UTC+5): 20:00 UTC on 1 Jul is already 2 Jul', () => {
    expect(todayKarachi(new Date('2025-07-01T20:00:00Z'))).toBe('2025-07-02')
  })
  it('stays on the same day before 19:00 UTC', () => {
    expect(todayKarachi(new Date('2025-07-01T18:59:00Z'))).toBe('2025-07-01')
  })
})

describe('formatters', () => {
  it('formats PKR as whole rupees with grouping', () => {
    expect(formatPkr(22000)).toBe('Rs 22,000')
  })
  it('formats a date string and falls back for empty values', () => {
    expect(formatDate('2025-07-02')).toBe('02 Jul 2025')
    expect(formatDate(null)).toBe('---')
  })
})
