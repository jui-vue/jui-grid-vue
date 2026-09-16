import { computed, reactive, type Ref } from 'vue'
import type { GridRow, SortOrder, SortState } from '../types'
import { compareRowValues } from './sortCompare'

/**
 * Sorts the top-level rows array by a column key. Mirrors jui-grid's original
 * behavior of only reordering the root rows, leaving nested `children` untouched.
 */
export function useSort(rows: Ref<GridRow[]>, onSort?: (state: SortState) => void) {
  const state = reactive<SortState>({ key: null, order: 'asc' })

  const sortedRows = computed(() => {
    if (!state.key) return rows.value

    const key = state.key
    const dir = state.order === 'desc' ? -1 : 1

    return [...rows.value].sort((a, b) => compareRowValues(a, b, key) * dir)
  })

  function toggleSort(key: string, order?: SortOrder) {
    if (order) {
      state.order = order
    } else if (state.key === key) {
      state.order = state.order === 'asc' ? 'desc' : 'asc'
    } else {
      state.order = 'asc'
    }

    state.key = key
    onSort?.({ key: state.key, order: state.order })
  }

  return { state, sortedRows, toggleSort }
}
