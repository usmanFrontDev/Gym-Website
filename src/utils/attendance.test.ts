import { describe, expect, it } from 'vitest'
import { buildMonthView, listMonths, summarizeMonths } from './attendance'

describe('listMonths', () => {
  it('lists every month from the joining month to the current month, newest first', () => {
    expect(listMonths('2026-02-17', '2026-04-30')).toEqual(['2026-04', '2026-03', '2026-02'])
  })

  it('returns only the current month for a member who joined this month', () => {
    expect(listMonths('2026-04-03', '2026-04-30')).toEqual(['2026-04'])
  })

  it('crosses a year boundary', () => {
    expect(listMonths('2025-11-30', '2026-01-02')).toEqual(['2026-01', '2025-12', '2025-11'])
  })
})

describe('buildMonthView', () => {
  const days = ['2026-02-20', '2026-02-21', '2026-03-02']

  it('counts attended days and the days the member could have come', () => {
    const view = buildMonthView('2026-02', days, '2026-02-17', '2026-04-30')
    expect(view.attended).toBe(2)
    // 17 Feb to 28 Feb = 12 days
    expect(view.countableDays).toBe(12)
  })

  it('counts a full month for months after joining and stops at today for the current month', () => {
    expect(buildMonthView('2026-03', days, '2026-02-17', '2026-04-30').countableDays).toBe(31)
    expect(buildMonthView('2026-04', days, '2026-02-17', '2026-04-10').countableDays).toBe(10)
  })

  it('handles a leap-year February', () => {
    expect(buildMonthView('2028-02', [], '2028-01-01', '2028-06-01').countableDays).toBe(29)
  })

  it('lays out calendar cells with leading blanks (week starts on Monday) and marks each day', () => {
    // 1 Mar 2026 is a Sunday, so six blank cells come first
    const view = buildMonthView('2026-03', days, '2026-02-17', '2026-04-30')
    expect(view.leadingBlanks).toBe(6)
    expect(view.cells).toHaveLength(31)
    expect(view.cells[1]).toMatchObject({ date: '2026-03-02', day: 2, attended: true, beforeJoin: false, future: false })
    expect(view.cells[0]).toMatchObject({ attended: false })
  })

  it('marks days before joining and days after today', () => {
    const view = buildMonthView('2026-02', days, '2026-02-17', '2026-04-30')
    expect(view.cells[15]).toMatchObject({ date: '2026-02-16', beforeJoin: true })
    const current = buildMonthView('2026-04', [], '2026-02-17', '2026-04-10')
    expect(current.cells[10]).toMatchObject({ date: '2026-04-11', future: true })
  })
})

describe('scans per day', () => {
  it('keeps a day with two scans as one attended day but remembers the scan count', () => {
    const view = buildMonthView('2026-03', ['2026-03-02'], '2026-02-17', '2026-04-30', { '2026-03-02': 2 })
    expect(view.attended).toBe(1)
    expect(view.cells[1]).toMatchObject({ attended: true, scans: 2 })
    expect(view.cells[2]).toMatchObject({ attended: false, scans: 0 })
  })
})

describe('summarizeMonths', () => {
  it('gives total attended days and the busiest month', () => {
    const summary = summarizeMonths(['2026-02-20', '2026-03-02', '2026-03-03', '2026-03-04'])
    expect(summary.total).toBe(4)
    expect(summary.byMonth).toEqual({ '2026-02': 1, '2026-03': 3 })
    expect(summary.busiestMonth).toBe('2026-03')
  })

  it('handles no visits', () => {
    expect(summarizeMonths([])).toEqual({ total: 0, byMonth: {}, busiestMonth: null })
  })
})
