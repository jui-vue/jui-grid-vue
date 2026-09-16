import { reactive, computed, watch, type Ref } from 'vue'
import type { GridColumn } from '../types'

interface ColumnState extends GridColumn {
  visible: boolean
}

/**
 * Tracks per-column show/hide + runtime width state, seeded from the `columns` prop.
 * Menu UI for toggling visibility is out of scope here (see plan) - only state + events.
 */
export function useColumns(columns: Ref<GridColumn[]>, onVisibilityChange?: (col: GridColumn) => void) {
  const state = reactive<ColumnState[]>(columns.value.map((c) => ({ ...c, visible: true })))

  watch(columns, (next) => {
    state.splice(
      0,
      state.length,
      ...next.map((c) => {
        const existing = state.find((s) => s.key === c.key)
        return { ...c, visible: existing ? existing.visible : true }
      }),
    )
  })

  const visibleColumns = computed(() => state.filter((c) => c.visible))

  function showColumn(key: string) {
    const col = state.find((c) => c.key === key)
    if (!col || col.visible) return
    col.visible = true
    onVisibilityChange?.(col)
  }

  function hideColumn(key: string) {
    const col = state.find((c) => c.key === key)
    if (!col || !col.visible) return
    col.visible = false
    onVisibilityChange?.(col)
  }

  function toggleColumn(key: string) {
    const col = state.find((c) => c.key === key)
    if (!col) return
    if (col.visible) hideColumn(key)
    else showColumn(key)
  }

  function setColumnWidth(key: string, width: number) {
    const col = state.find((c) => c.key === key)
    if (col) col.width = width
  }

  return { state, visibleColumns, showColumn, hideColumn, toggleColumn, setColumnWidth }
}
