import { ref } from 'vue'
import type { RowId } from '../types'

/**
 * Native HTML5 drag-and-drop based row reordering, replacing jui-grid's manual
 * mousedown/mousemove/mouseup clone-row implementation.
 */
export function useRowDrag(onMove?: (fromId: RowId, toId: RowId) => void) {
  const dragId = ref<RowId | null>(null)
  const dragOverId = ref<RowId | null>(null)

  function onDragStart(id: RowId) {
    dragId.value = id
  }

  function onDragOver(id: RowId) {
    if (dragId.value == null || dragId.value === id) return
    dragOverId.value = id
  }

  function onDragLeave(id: RowId) {
    if (dragOverId.value === id) dragOverId.value = null
  }

  function onDrop(id: RowId) {
    if (dragId.value != null && dragId.value !== id) {
      onMove?.(dragId.value, id)
    }
    dragId.value = null
    dragOverId.value = null
  }

  function onDragEnd() {
    dragId.value = null
    dragOverId.value = null
  }

  return { dragId, dragOverId, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }
}
