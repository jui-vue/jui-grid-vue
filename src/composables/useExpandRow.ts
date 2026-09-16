import { ref } from 'vue'
import type { RowId } from '../types'

export function useExpandRow() {
  const expandedId = ref<RowId | null>(null)

  function showExpand(id: RowId) {
    expandedId.value = id
  }

  function hideExpand() {
    expandedId.value = null
  }

  function toggleExpand(id: RowId) {
    expandedId.value = expandedId.value === id ? null : id
  }

  function isExpanded(id: RowId) {
    return expandedId.value === id
  }

  return { expandedId, showExpand, hideExpand, toggleExpand, isExpanded }
}
