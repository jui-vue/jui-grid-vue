import { ref } from 'vue'
import type { RowId } from '../types'

/**
 * Row reordering, mirroring legacy grid.table's own mousedown/mousemove/mouseup mechanism
 * (a floating clone of the dragged row follows the cursor at pageX+2/pageY+2, a thin
 * "dragline" placeholder row shows the drop position) rather than native HTML5 drag-and-drop,
 * which has no equivalent for either visual and fires a different event sequence - confirmed
 * against uiplay's actual grid.min.js source and interactive drag behavior.
 *
 * `getRowIds` returns the current row order; `onMove(fromId, beforeId)` fires on drop with
 * beforeId = the id of the row the dragged row should land in front of, or undefined to mean
 * "move to the end" - this lets the caller do a plain id-based splice without needing to
 * replicate legacy's index-shift-after-removal arithmetic itself.
 */
export function useRowDrag(getRowIds: () => RowId[], onMove?: (fromId: RowId, beforeId: RowId | undefined) => void) {
  // dragId marks which row gets the .dragtarget highlight - legacy never clears it on drop
  // (successful, declined, or a no-op same-spot drop all leave it set), only the *next*
  // mousedown reassigns it, so a completed move leaves its row visibly highlighted.
  const dragId = ref<RowId | null>(null)
  const dragOverIndex = ref<number | null>(null)

  let dragging = false
  let sourceIndex: number | null = null
  let cloneEl: HTMLElement | null = null

  function createClone(rowEl: HTMLElement) {
    const sourceTable = rowEl.closest('table')
    const table = document.createElement('table')
    table.className = `${sourceTable?.className ?? ''} layer`.trim()
    table.style.position = 'absolute'
    table.style.width = `${sourceTable?.getBoundingClientRect().width ?? rowEl.getBoundingClientRect().width}px`
    table.style.display = 'none'
    const tbody = document.createElement('tbody')
    const clone = rowEl.cloneNode(true) as HTMLElement
    clone.className = 'dragclone'
    clone.removeAttribute('style')
    tbody.appendChild(clone)
    table.appendChild(tbody)
    document.body.appendChild(table)
    return table
  }

  function onMouseMove(e: MouseEvent) {
    if (!cloneEl) return
    cloneEl.style.left = `${e.pageX + 2}px`
    cloneEl.style.top = `${e.pageY + 2}px`
    cloneEl.style.display = 'table'
  }

  // Fallback for when the cursor is over the table but off every row (e.g. below the last
  // row, in the scroll-container's own padding) - legacy checks the hovered tag is neither
  // TD nor TR and snaps the placeholder to the end.
  function onDocMouseOver(e: MouseEvent) {
    if (!dragging) return
    const target = e.target as HTMLElement | null
    if (!target?.closest('td, tr')) dragOverIndex.value = getRowIds().length
  }

  function onDocMouseUp() {
    drop(getRowIds().length)
  }

  function endDrag() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseover', onDocMouseOver)
    document.removeEventListener('mouseup', onDocMouseUp)
    cloneEl?.remove()
    cloneEl = null
    dragOverIndex.value = null
    dragging = false
    sourceIndex = null
  }

  function drop(targetIndex: number) {
    dragOverIndex.value = null
    if (!dragging) return
    const fromId = dragId.value as RowId
    const from = sourceIndex
    const ids = getRowIds()
    endDrag()
    if (from != null && from !== targetIndex) {
      onMove?.(fromId, targetIndex < ids.length ? ids[targetIndex] : undefined)
    }
  }

  function onRowMouseDown(id: RowId, index: number, e: MouseEvent) {
    if (dragging) return
    dragging = true
    dragId.value = id
    sourceIndex = index
    cloneEl = createClone(e.currentTarget as HTMLElement)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onDocMouseOver)
    document.addEventListener('mouseup', onDocMouseUp)
  }

  function onRowMouseOver(index: number) {
    if (dragging) dragOverIndex.value = index
  }

  function onRowMouseUp(index: number) {
    if (dragging) drop(index)
  }

  // Legacy binds this on the header row's mouseover (not mouseup) - dragging a row up past
  // the top of the body and merely hovering the header is enough to commit the move to index 0.
  function onTheadMouseOver() {
    if (dragging) drop(0)
  }

  return { dragId, dragOverIndex, onRowMouseDown, onRowMouseOver, onRowMouseUp, onTheadMouseOver }
}
