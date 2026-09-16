import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useMultiSort } from './useMultiSort'
import type { GridRow } from '../types'

function makeRows(): GridRow[] {
  return [
    { id: 1, data: { team: 'b', score: 2 } },
    { id: 2, data: { team: 'a', score: 2 } },
    { id: 3, data: { team: 'a', score: 1 } },
    { id: 4, data: { team: 'b', score: 1 } },
  ]
}

describe('useMultiSort', () => {
  it('sorts by a single key on a plain click', () => {
    const rows = ref(makeRows())
    const { sortedRows, toggleSort } = useMultiSort(rows)
    toggleSort('team')
    expect(sortedRows.value.map((r) => r.id)).toEqual([2, 3, 1, 4])
  })

  it('a second plain click on the same key toggles direction instead of adding a criterion', () => {
    const rows = ref(makeRows())
    const { criteria, toggleSort } = useMultiSort(rows)
    toggleSort('team')
    toggleSort('team')
    expect(criteria).toEqual([{ key: 'team', order: 'desc' }])
  })

  it('a plain click on a different key replaces all criteria', () => {
    const rows = ref(makeRows())
    const { criteria, toggleSort } = useMultiSort(rows)
    toggleSort('team', true)
    toggleSort('score', true)
    toggleSort('team') // non-additive -> replaces
    expect(criteria).toEqual([{ key: 'team', order: 'asc' }])
  })

  it('additive (shift-click) toggles add a secondary sort key, honoring priority order', () => {
    const rows = ref(makeRows())
    const { sortedRows, toggleSort } = useMultiSort(rows)
    toggleSort('team', true)
    toggleSort('score', true)
    // team asc, then score asc within each team
    expect(sortedRows.value.map((r) => r.id)).toEqual([3, 2, 4, 1])
  })

  it('additive toggles cycle asc -> desc -> removed for a secondary key', () => {
    const rows = ref(makeRows())
    const { criteria, toggleSort } = useMultiSort(rows)
    toggleSort('team', true)
    toggleSort('score', true) // asc
    toggleSort('score', true) // desc
    expect(criteria).toEqual([
      { key: 'team', order: 'asc' },
      { key: 'score', order: 'desc' },
    ])
    toggleSort('score', true) // removed
    expect(criteria).toEqual([{ key: 'team', order: 'asc' }])
  })

  it('clearSort removes every criterion', () => {
    const rows = ref(makeRows())
    const { criteria, toggleSort, clearSort } = useMultiSort(rows)
    toggleSort('team', true)
    toggleSort('score', true)
    clearSort()
    expect(criteria).toEqual([])
  })

  it('orderOf and priorityOf reflect current criteria', () => {
    const rows = ref(makeRows())
    const { toggleSort, orderOf, priorityOf } = useMultiSort(rows)
    toggleSort('team', true)
    toggleSort('score', true)
    expect(orderOf('team')).toBe('asc')
    expect(priorityOf('team')).toBe(1)
    expect(priorityOf('score')).toBe(2)
    expect(orderOf('missing')).toBeNull()
    expect(priorityOf('missing')).toBeNull()
  })

  it('invokes onSort with a snapshot of the criteria', () => {
    const rows = ref(makeRows())
    const onSort = vi.fn()
    const { toggleSort } = useMultiSort(rows, onSort)
    toggleSort('team', true)
    expect(onSort).toHaveBeenCalledWith([{ key: 'team', order: 'asc' }])
  })

  it('honors an initial set of sort criteria', () => {
    const rows = ref(makeRows())
    const { criteria, sortedRows } = useMultiSort(rows, undefined, [
      { key: 'team', order: 'asc' },
      { key: 'score', order: 'desc' },
    ])
    expect(criteria).toEqual([
      { key: 'team', order: 'asc' },
      { key: 'score', order: 'desc' },
    ])
    expect(sortedRows.value.map((r) => r.id)).toEqual([2, 3, 1, 4])
  })
})
