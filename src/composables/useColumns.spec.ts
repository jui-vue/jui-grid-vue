import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useColumns } from './useColumns'
import type { GridColumn } from '../types'

function makeColumns(): GridColumn[] {
  return [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
    { key: 'c', label: 'C' },
  ]
}

describe('useColumns', () => {
  it('marks all columns visible by default', () => {
    const scope = effectScope()
    scope.run(() => {
      const columns = ref(makeColumns())
      const { visibleColumns } = useColumns(columns)
      expect(visibleColumns.value.map((c) => c.key)).toEqual(['a', 'b', 'c'])
    })
    scope.stop()
  })

  it('hides and shows a column by key', () => {
    const scope = effectScope()
    scope.run(() => {
      const columns = ref(makeColumns())
      const { visibleColumns, hideColumn, showColumn } = useColumns(columns)

      hideColumn('b')
      expect(visibleColumns.value.map((c) => c.key)).toEqual(['a', 'c'])

      showColumn('b')
      expect(visibleColumns.value.map((c) => c.key)).toEqual(['a', 'b', 'c'])
    })
    scope.stop()
  })

  it('toggleColumn flips visibility', () => {
    const scope = effectScope()
    scope.run(() => {
      const columns = ref(makeColumns())
      const { visibleColumns, toggleColumn } = useColumns(columns)

      toggleColumn('a')
      expect(visibleColumns.value.map((c) => c.key)).toEqual(['b', 'c'])
      toggleColumn('a')
      expect(visibleColumns.value.map((c) => c.key)).toEqual(['a', 'b', 'c'])
    })
    scope.stop()
  })

  it('fires the visibility callback exactly once per change', () => {
    const scope = effectScope()
    scope.run(() => {
      const columns = ref(makeColumns())
      const onChange = vi.fn()
      const { hideColumn } = useColumns(columns, onChange)

      hideColumn('a')
      hideColumn('a') // already hidden, should be a no-op
      expect(onChange).toHaveBeenCalledTimes(1)
    })
    scope.stop()
  })

  it('preserves visibility state when the columns prop changes but keys stay the same', async () => {
    const scope = effectScope()
    await scope.run(async () => {
      const columns = ref(makeColumns())
      const { visibleColumns, hideColumn } = useColumns(columns)

      hideColumn('b')
      columns.value = [...makeColumns()].map((c) => ({ ...c, label: c.label + '!' }))
      await nextTick()

      expect(visibleColumns.value.map((c) => c.key)).toEqual(['a', 'c'])
    })
    scope.stop()
  })

  it('honors an initial visible:false on a column (e.g. a colshow subset)', () => {
    const scope = effectScope()
    scope.run(() => {
      const columns = ref<GridColumn[]>([{ key: 'a' }, { key: 'b', visible: false }, { key: 'c' }])
      const { visibleColumns } = useColumns(columns)
      expect(visibleColumns.value.map((c) => c.key)).toEqual(['a', 'c'])
    })
    scope.stop()
  })

  it('initColumns shows exactly the given keys and hides everything else', () => {
    const scope = effectScope()
    scope.run(() => {
      const columns = ref(makeColumns())
      const { visibleColumns, initColumns } = useColumns(columns)
      initColumns(['a', 'c'])
      expect(visibleColumns.value.map((c) => c.key)).toEqual(['a', 'c'])
      initColumns(['b'])
      expect(visibleColumns.value.map((c) => c.key)).toEqual(['b'])
    })
    scope.stop()
  })

  it('initColumns fires the visibility callback once per column that actually changed', () => {
    const scope = effectScope()
    scope.run(() => {
      const columns = ref(makeColumns())
      const onChange = vi.fn()
      const { initColumns } = useColumns(columns, onChange)
      initColumns(['a']) // b and c change, a stays visible
      expect(onChange).toHaveBeenCalledTimes(2)
    })
    scope.stop()
  })

  it('setColumnWidth updates a column width', () => {
    const scope = effectScope()
    scope.run(() => {
      const columns = ref(makeColumns())
      const { state, setColumnWidth } = useColumns(columns)
      setColumnWidth('a', 200)
      expect(state.find((c) => c.key === 'a')?.width).toBe(200)
    })
    scope.stop()
  })
})
