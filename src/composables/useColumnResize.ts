import { onBeforeUnmount } from 'vue'
import type { GridColumn } from '../types'

const MIN_COLUMN_WIDTH = 30

/**
 * Drag-resizes a column against its immediate neighbor, keeping their combined
 * width constant - same tradeoff jui-grid's original setColumnResize made.
 */
export function useColumnResize(getColumnWidth: (key: string) => number, setColumnWidth: (key: string, width: number) => void, onResizeEnd?: (column: GridColumn) => void) {
  let startX = 0
  let col: GridColumn | null = null
  let nextCol: GridColumn | null = null
  let colStartWidth = 0
  let nextColStartWidth = 0

  function onMouseMove(e: MouseEvent) {
    if (!col || !nextCol) return

    const dx = e.pageX - startX
    const newColWidth = colStartWidth + dx
    const newNextWidth = nextColStartWidth - dx

    if (newColWidth < MIN_COLUMN_WIDTH || newNextWidth < MIN_COLUMN_WIDTH) return

    setColumnWidth(col.key, newColWidth)
    setColumnWidth(nextCol.key, newNextWidth)
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)

    if (col) onResizeEnd?.(col)
    col = null
    nextCol = null
  }

  function onResizeStart(e: MouseEvent, column: GridColumn, nextColumn: GridColumn) {
    startX = e.pageX
    col = column
    nextCol = nextColumn

    // column.width defaults to a placeholder (getColumnWidth's ?? 120) until a resize sets it
    // explicitly, but the <th> itself may already be rendering much wider via auto layout - so
    // always start from what's actually on screen, not the possibly-stale tracked width.
    const th = (e.currentTarget as HTMLElement | null)?.closest('th')
    const nextTh = th?.nextElementSibling as HTMLElement | null
    colStartWidth = th ? th.getBoundingClientRect().width : getColumnWidth(column.key)
    nextColStartWidth = nextTh ? nextTh.getBoundingClientRect().width : getColumnWidth(nextColumn.key)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    e.preventDefault()
  }

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  })

  return { onResizeStart }
}
