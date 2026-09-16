import type { GridRow } from '../types'

/** Shared comparator used by useSort and useMultiSort: case-insensitive for strings, numeric otherwise. */
export function compareRowValues(a: GridRow, b: GridRow, key: string): number {
  const av = a.data[key]
  const bv = b.data[key]

  if (typeof av === 'string' && typeof bv === 'string') {
    return av.toLowerCase().localeCompare(bv.toLowerCase())
  }

  const an = Number(av)
  const bn = Number(bv)
  if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn

  return String(av).localeCompare(String(bv))
}
