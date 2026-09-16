import { describe, expect, it } from 'vitest'
import { rowsToCsv, parseCsv, csvToRowData } from './useCsv'
import type { GridColumn, GridRow } from '../types'

const columns: GridColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'qty', label: 'Qty' },
]

const rows: GridRow[] = [
  { id: 1, data: { name: 'apple', qty: 3 } },
  { id: 2, data: { name: 'has, comma', qty: 1 } },
  { id: 3, data: { name: 'has "quote"', qty: 2 } },
]

describe('rowsToCsv', () => {
  it('produces a header row followed by one row per data row', () => {
    const csv = rowsToCsv(columns, rows.slice(0, 1))
    expect(csv).toBe('Name,Qty\napple,3')
  })

  it('quotes fields containing commas', () => {
    const csv = rowsToCsv(columns, [rows[1]])
    expect(csv).toContain('"has, comma",1')
  })

  it('escapes embedded quotes by doubling them', () => {
    const csv = rowsToCsv(columns, [rows[2]])
    expect(csv).toContain('"has ""quote""",2')
  })

  it('treats null/undefined values as empty strings', () => {
    const csv = rowsToCsv(columns, [{ id: 4, data: { name: null, qty: undefined } }])
    expect(csv).toBe('Name,Qty\n,')
  })
})

describe('parseCsv', () => {
  it('round-trips a simple CSV', () => {
    const csv = rowsToCsv(columns, rows.slice(0, 1))
    expect(parseCsv(csv)).toEqual([
      ['Name', 'Qty'],
      ['apple', '3'],
    ])
  })

  it('round-trips quoted fields with commas and embedded quotes', () => {
    const csv = rowsToCsv(columns, [rows[1], rows[2]])
    const parsed = parseCsv(csv)
    expect(parsed[1]).toEqual(['has, comma', '1'])
    expect(parsed[2]).toEqual(['has "quote"', '2'])
  })

  it('handles CRLF and LF line endings', () => {
    expect(parseCsv('a,b\r\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })
})

describe('csvToRowData', () => {
  it('maps data rows to objects keyed by column, skipping the header row', () => {
    const csv = rowsToCsv(columns, rows.slice(0, 1))
    expect(csvToRowData(csv, columns)).toEqual([{ name: 'apple', qty: '3' }])
  })

  it('round-trips quoted fields back into the right column', () => {
    const csv = rowsToCsv(columns, [rows[1]])
    expect(csvToRowData(csv, columns)).toEqual([{ name: 'has, comma', qty: '1' }])
  })

  it('ignores a trailing blank line', () => {
    expect(csvToRowData('Name,Qty\napple,3\n', columns)).toEqual([{ name: 'apple', qty: '3' }])
  })

  it('returns an empty array for header-only input', () => {
    expect(csvToRowData('Name,Qty', columns)).toEqual([])
  })
})
