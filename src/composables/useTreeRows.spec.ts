import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useTreeRows } from './useTreeRows'
import type { GridRow } from '../types'

function makeTree(): GridRow[] {
  return [
    {
      id: 'a',
      data: { name: 'A' },
      children: [
        { id: 'a-1', data: { name: 'A1' } },
        { id: 'a-2', data: { name: 'A2' }, children: [{ id: 'a-2-1', data: { name: 'A2.1' } }] },
      ],
    },
    { id: 'b', data: { name: 'B' } },
  ]
}

describe('useTreeRows', () => {
  it('flattens only top-level rows when nothing is expanded', () => {
    const rows = ref(makeTree())
    const { flatRows } = useTreeRows(rows)
    expect(flatRows.value.map((f) => f.row.id)).toEqual(['a', 'b'])
    expect(flatRows.value[0].hasChildren).toBe(true)
    expect(flatRows.value[0].expanded).toBe(false)
    expect(flatRows.value[1].hasChildren).toBe(false)
  })

  it('reveals immediate children once a parent is opened', () => {
    const rows = ref(makeTree())
    const { flatRows, open } = useTreeRows(rows)
    open('a')
    expect(flatRows.value.map((f) => f.row.id)).toEqual(['a', 'a-1', 'a-2', 'b'])
    expect(flatRows.value.find((f) => f.row.id === 'a-1')?.depth).toBe(1)
  })

  it('does not reveal grandchildren until the nested parent is also opened', () => {
    const rows = ref(makeTree())
    const { flatRows, open } = useTreeRows(rows)
    open('a')
    expect(flatRows.value.map((f) => f.row.id)).not.toContain('a-2-1')
    open('a-2')
    expect(flatRows.value.map((f) => f.row.id)).toEqual(['a', 'a-1', 'a-2', 'a-2-1', 'b'])
    expect(flatRows.value.find((f) => f.row.id === 'a-2-1')?.depth).toBe(2)
  })

  it('fold hides children again', () => {
    const rows = ref(makeTree())
    const { flatRows, open, fold } = useTreeRows(rows)
    open('a')
    fold('a')
    expect(flatRows.value.map((f) => f.row.id)).toEqual(['a', 'b'])
  })

  it('toggle flips open/fold state', () => {
    const rows = ref(makeTree())
    const { isExpanded, toggle } = useTreeRows(rows)
    toggle('a')
    expect(isExpanded('a')).toBe(true)
    toggle('a')
    expect(isExpanded('a')).toBe(false)
  })

  it('openAll expands every parent at every depth', () => {
    const rows = ref(makeTree())
    const { flatRows, openAll } = useTreeRows(rows)
    openAll()
    expect(flatRows.value.map((f) => f.row.id)).toEqual(['a', 'a-1', 'a-2', 'a-2-1', 'b'])
  })

  it('foldAll collapses everything back to top level', () => {
    const rows = ref(makeTree())
    const { flatRows, openAll, foldAll } = useTreeRows(rows)
    openAll()
    foldAll()
    expect(flatRows.value.map((f) => f.row.id)).toEqual(['a', 'b'])
  })
})
