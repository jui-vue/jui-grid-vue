import { reactive, ref } from 'vue'
import type { GridRow, RowId } from '../types'

export function useEditableRow(onCommit?: (row: GridRow, data: Record<string, any>) => void) {
  const editingId = ref<RowId | null>(null)
  const draft = reactive<Record<string, any>>({})

  function startEdit(row: GridRow) {
    editingId.value = row.id
    Object.keys(draft).forEach((k) => delete draft[k])
    Object.assign(draft, row.data)
  }

  function cancelEdit() {
    editingId.value = null
  }

  function commitEdit(row: GridRow) {
    if (editingId.value !== row.id) return
    onCommit?.(row, { ...draft })
    editingId.value = null
  }

  function isEditing(id: RowId) {
    return editingId.value === id
  }

  return { editingId, draft, startEdit, cancelEdit, commitEdit, isEditing }
}
