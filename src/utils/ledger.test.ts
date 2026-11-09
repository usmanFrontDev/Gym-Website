import { describe, expect, it } from 'vitest'
import type { LedgerRow } from '@/types/superAdmin/admin.types'
import { ledgerCsv, ledgerRange } from './ledger'

describe('ledgerRange', () => {
  it('daily is the single chosen day', () => {
    expect(ledgerRange('daily', '2026-11-09')).toEqual(['2026-11-09', '2026-11-09'])
  })
  it('monthly covers the whole month of the chosen day', () => {
    expect(ledgerRange('monthly', '2026-11-09')).toEqual(['2026-11-01', '2026-11-30'])
    expect(ledgerRange('monthly', '2028-02-10')).toEqual(['2028-02-01', '2028-02-29'])
  })
  it('yearly covers the whole year of the chosen day', () => {
    expect(ledgerRange('yearly', '2026-11-09')).toEqual(['2026-01-01', '2026-12-31'])
  })
  it('all time has no bounds', () => {
    expect(ledgerRange('all', '2026-11-09')).toEqual([null, null])
  })
})

describe('ledgerCsv', () => {
  const rows: LedgerRow[] = [
    { id: '1', kind: 'INCOME', day: '2026-11-02', amount: 3500, label: 'Ali "Ace" Raza', method: 'ONLINE', note: null },
    { id: '2', kind: 'EXPENSE', day: '2026-11-01', amount: 40000, label: 'RENT', method: null, note: 'Shop, November' },
  ]
  it('writes a header and one escaped line per entry', () => {
    expect(ledgerCsv(rows).split('\n')).toEqual([
      'Date,Type,Details,Payment type,Note,Amount',
      '2026-11-02,Income,"Ali ""Ace"" Raza",Online payment,,3500',
      '2026-11-01,Expense,Rent,,"Shop, November",40000',
    ])
  })
})
