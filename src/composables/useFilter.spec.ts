import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useFilter } from './useFilter'
import type { GridRow } from '../types'

function makeRows(): GridRow[] {
  return [
    { id: 1, data: { name: 'apple', qty: 3 } },
    { id: 2, data: { name: 'banana', qty: 0 } },
    { id: 3, data: { name: 'cherry', qty: 5 } },
  ]
}

describe('useFilter', () => {
  it('passes rows through unchanged with no filter set', () => {
    const rows = ref(makeRows())
    const { filteredRows, hasFilter } = useFilter(rows)
    expect(filteredRows.value).toHaveLength(3)
    expect(hasFilter.value).toBe(false)
  })

  it('applies a predicate to filter rows', () => {
    const rows = ref(makeRows())
    const { filteredRows, setFilter, hasFilter } = useFilter(rows)
    setFilter((row) => row.data.qty > 0)
    expect(filteredRows.value.map((r) => r.id)).toEqual([1, 3])
    expect(hasFilter.value).toBe(true)
  })

  it('clearFilter restores the full row set', () => {
    const rows = ref(makeRows())
    const { filteredRows, setFilter, clearFilter } = useFilter(rows)
    setFilter((row) => row.data.qty > 0)
    clearFilter()
    expect(filteredRows.value).toHaveLength(3)
  })

  it('re-evaluates when the underlying rows change', () => {
    const rows = ref(makeRows())
    const { filteredRows, setFilter } = useFilter(rows)
    setFilter((row) => row.data.name.startsWith('b'))
    expect(filteredRows.value.map((r) => r.id)).toEqual([2])
    rows.value = [...rows.value, { id: 4, data: { name: 'blueberry', qty: 1 } }]
    expect(filteredRows.value.map((r) => r.id)).toEqual([2, 4])
  })
})
