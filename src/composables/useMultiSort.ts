import { computed, reactive, type Ref } from 'vue'
import type { GridRow, SortOrder } from '../types'
import { compareRowValues } from './sortCompare'

export interface SortCriterion {
  key: string
  order: SortOrder
}

/**
 * Multi-column sort (xtable's `msort`): plain click replaces the sort with a single
 * key, shift-click adds/cycles/removes an additional key while keeping priority order.
 */
export function useMultiSort(rows: Ref<GridRow[]>, onSort?: (criteria: SortCriterion[]) => void, initial?: SortCriterion[]) {
  const criteria = reactive<SortCriterion[]>(initial ? [...initial] : [])

  const sortedRows = computed(() => {
    if (criteria.length === 0) return rows.value

    return [...rows.value].sort((a, b) => {
      for (const c of criteria) {
        const cmp = compareRowValues(a, b, c.key) * (c.order === 'desc' ? -1 : 1)
        if (cmp !== 0) return cmp
      }
      return 0
    })
  })

  function toggleSort(key: string, additive = false) {
    const index = criteria.findIndex((c) => c.key === key)

    if (!additive) {
      if (criteria.length === 1 && index === 0) {
        criteria[0].order = criteria[0].order === 'asc' ? 'desc' : 'asc'
      } else {
        criteria.splice(0, criteria.length, { key, order: 'asc' })
      }
    } else if (index === -1) {
      criteria.push({ key, order: 'asc' })
    } else if (criteria[index].order === 'asc') {
      criteria[index].order = 'desc'
    } else {
      criteria.splice(index, 1)
    }

    onSort?.([...criteria])
  }

  function clearSort() {
    criteria.splice(0, criteria.length)
  }

  function orderOf(key: string): SortOrder | null {
    return criteria.find((c) => c.key === key)?.order ?? null
  }

  function priorityOf(key: string): number | null {
    const index = criteria.findIndex((c) => c.key === key)
    return index === -1 ? null : index + 1
  }

  return { criteria, sortedRows, toggleSort, clearSort, orderOf, priorityOf }
}
