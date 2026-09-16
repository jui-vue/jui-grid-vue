import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useSort } from './useSort'
import type { GridRow } from '../types'

function makeRows(): GridRow[] {
  return [
    { id: 1, data: { name: 'banana', qty: 3 } },
    { id: 2, data: { name: 'apple', qty: 10 } },
    { id: 3, data: { name: 'cherry', qty: 1 } },
  ]
}

describe('useSort', () => {
  it('leaves rows untouched until a sort is applied', () => {
    const rows = ref(makeRows())
    const { sortedRows } = useSort(rows)
    expect(sortedRows.value.map((r) => r.id)).toEqual([1, 2, 3])
  })

  it('sorts strings case-insensitively ascending', () => {
    const rows = ref(makeRows())
    const { sortedRows, toggleSort } = useSort(rows)
    toggleSort('name')
    expect(sortedRows.value.map((r) => r.data.name)).toEqual(['apple', 'banana', 'cherry'])
  })

  it('toggles to descending on a second call for the same key', () => {
    const rows = ref(makeRows())
    const { sortedRows, toggleSort, state } = useSort(rows)
    toggleSort('name')
    toggleSort('name')
    expect(state.order).toBe('desc')
    expect(sortedRows.value.map((r) => r.data.name)).toEqual(['cherry', 'banana', 'apple'])
  })

  it('resets to ascending when switching to a different column', () => {
    const rows = ref(makeRows())
    const { toggleSort, state } = useSort(rows)
    toggleSort('name')
    toggleSort('name') // desc
    toggleSort('qty') // switch column -> asc
    expect(state.key).toBe('qty')
    expect(state.order).toBe('asc')
  })

  it('sorts numerically when values are numeric', () => {
    const rows = ref(makeRows())
    const { sortedRows, toggleSort } = useSort(rows)
    toggleSort('qty')
    expect(sortedRows.value.map((r) => r.data.qty)).toEqual([1, 3, 10])
  })

  it('does not mutate the original rows array', () => {
    const original = makeRows()
    const rows = ref(original)
    const { sortedRows, toggleSort } = useSort(rows)
    toggleSort('name')
    expect(sortedRows.value).not.toBe(original)
    expect(original.map((r) => r.id)).toEqual([1, 2, 3])
  })

  it('invokes the onSort callback with the resulting state', () => {
    const rows = ref(makeRows())
    const onSort = vi.fn()
    const { toggleSort } = useSort(rows, onSort)
    toggleSort('name')
    expect(onSort).toHaveBeenCalledWith({ key: 'name', order: 'asc' })
  })

  it('accepts an explicit order override', () => {
    const rows = ref(makeRows())
    const { state, toggleSort } = useSort(rows)
    toggleSort('name', 'desc')
    expect(state.order).toBe('desc')
  })

  it('honors an initial sort state (sortIndex/sortOrder parity)', () => {
    const rows = ref(makeRows())
    const { state, sortedRows } = useSort(rows, undefined, { key: 'name', order: 'desc' })
    expect(state).toEqual({ key: 'name', order: 'desc' })
    expect(sortedRows.value.map((r) => r.data.name)).toEqual(['cherry', 'banana', 'apple'])
  })
})
