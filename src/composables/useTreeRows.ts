import { computed, reactive, type Ref } from 'vue'
import type { FlatRow, GridRow, RowId } from '../types'

export function useTreeRows(rows: Ref<GridRow[]>) {
  const expandedIds = reactive(new Set<RowId>())

  function isExpanded(id: RowId) {
    return expandedIds.has(id)
  }

  function open(id: RowId) {
    expandedIds.add(id)
  }

  function fold(id: RowId) {
    expandedIds.delete(id)
  }

  function toggle(id: RowId) {
    if (isExpanded(id)) fold(id)
    else open(id)
  }

  function collectParentIds(list: GridRow[], acc: RowId[]) {
    for (const row of list) {
      if (row.children && row.children.length > 0) {
        acc.push(row.id)
        collectParentIds(row.children, acc)
      }
    }
  }

  function openAll() {
    const ids: RowId[] = []
    collectParentIds(rows.value, ids)
    ids.forEach((id) => expandedIds.add(id))
  }

  function foldAll() {
    expandedIds.clear()
  }

  const flatRows = computed<FlatRow[]>(() => {
    const result: FlatRow[] = []

    function walk(list: GridRow[], depth: number) {
      for (const row of list) {
        const hasChildren = !!(row.children && row.children.length > 0)
        const expanded = hasChildren && isExpanded(row.id)
        result.push({ row, depth, hasChildren, expanded })

        if (hasChildren && expanded) walk(row.children!, depth + 1)
      }
    }

    walk(rows.value, 0)
    return result
  })

  return { expandedIds, isExpanded, open, fold, toggle, openAll, foldAll, flatRows }
}
