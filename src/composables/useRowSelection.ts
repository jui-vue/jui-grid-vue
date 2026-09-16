import { reactive, ref } from 'vue'
import type { RowId } from '../types'

export function useRowSelection() {
  const selectedId = ref<RowId | null>(null)
  const checkedIds = reactive(new Set<RowId>())

  function select(id: RowId) {
    selectedId.value = id
  }

  function unselect() {
    selectedId.value = null
  }

  function isSelected(id: RowId) {
    return selectedId.value === id
  }

  function check(id: RowId) {
    checkedIds.add(id)
  }

  function uncheck(id: RowId) {
    checkedIds.delete(id)
  }

  function toggleCheck(id: RowId) {
    if (checkedIds.has(id)) uncheck(id)
    else check(id)
  }

  function uncheckAll() {
    checkedIds.clear()
  }

  function isChecked(id: RowId) {
    return checkedIds.has(id)
  }

  return { selectedId, checkedIds, select, unselect, isSelected, check, uncheck, toggleCheck, uncheckAll, isChecked }
}
