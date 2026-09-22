import { describe, expect, it, vi } from 'vitest'
import { useRowDrag } from './useRowDrag'

function makeRow(): HTMLTableRowElement {
  const table = document.createElement('table')
  table.className = 'table classic'
  const tbody = document.createElement('tbody')
  const row = document.createElement('tr')
  row.innerHTML = '<td>A</td><td>B</td>'
  tbody.appendChild(row)
  table.appendChild(tbody)
  document.body.appendChild(table)
  return row
}

function mousedown(rowEl: HTMLElement) {
  return { currentTarget: rowEl } as unknown as MouseEvent
}

describe('useRowDrag', () => {
  it('invokes onMove with the source id and the id it should land before', () => {
    const onMove = vi.fn()
    const { onRowMouseDown, onRowMouseUp } = useRowDrag(() => [1, 2, 3], onMove)
    onRowMouseDown(1, 0, mousedown(makeRow()))
    onRowMouseUp(2)
    expect(onMove).toHaveBeenCalledWith(1, 3)
  })

  it('passes undefined beforeId when dropped past the last row', () => {
    const onMove = vi.fn()
    const { onRowMouseDown, onRowMouseUp } = useRowDrag(() => [1, 2, 3], onMove)
    onRowMouseDown(1, 0, mousedown(makeRow()))
    onRowMouseUp(3)
    expect(onMove).toHaveBeenCalledWith(1, undefined)
  })

  it('does not call onMove when dropping back at the same index', () => {
    const onMove = vi.fn()
    const { onRowMouseDown, onRowMouseUp } = useRowDrag(() => [1, 2, 3], onMove)
    onRowMouseDown(1, 0, mousedown(makeRow()))
    onRowMouseUp(0)
    expect(onMove).not.toHaveBeenCalled()
  })

  it('does not call onMove when nothing was dragged', () => {
    const onMove = vi.fn()
    const { onRowMouseUp } = useRowDrag(() => [1, 2, 3], onMove)
    onRowMouseUp(1)
    expect(onMove).not.toHaveBeenCalled()
  })

  it('tracks dragOverIndex while hovering and clears it on drop', () => {
    const { onRowMouseDown, onRowMouseOver, onRowMouseUp, dragOverIndex } = useRowDrag(() => [1, 2, 3])
    onRowMouseDown(1, 0, mousedown(makeRow()))
    onRowMouseOver(2)
    expect(dragOverIndex.value).toBe(2)
    onRowMouseUp(2)
    expect(dragOverIndex.value).toBeNull()
  })

  it('commits the move to index 0 on thead mouseover, not mouseup', () => {
    const onMove = vi.fn()
    const { onRowMouseDown, onTheadMouseOver } = useRowDrag(() => [1, 2, 3], onMove)
    onRowMouseDown(3, 2, mousedown(makeRow()))
    onTheadMouseOver()
    expect(onMove).toHaveBeenCalledWith(3, 1)
  })

  it('keeps dragId set to the moved row after a successful drop (legacy leaves it highlighted)', () => {
    const { onRowMouseDown, onRowMouseUp, dragId } = useRowDrag(() => [1, 2, 3])
    onRowMouseDown(1, 0, mousedown(makeRow()))
    onRowMouseUp(2)
    expect(dragId.value).toBe(1)
  })

  it('lets a new drag reassign dragId to the newly grabbed row', () => {
    const { onRowMouseDown, onRowMouseUp, dragId } = useRowDrag(() => [1, 2, 3])
    onRowMouseDown(1, 0, mousedown(makeRow()))
    onRowMouseUp(2)
    onRowMouseDown(2, 1, mousedown(makeRow()))
    expect(dragId.value).toBe(2)
    onRowMouseUp(1)
  })

  it('appends a floating clone of the dragged row to <body> and removes it on drop', () => {
    const { onRowMouseDown, onRowMouseUp } = useRowDrag(() => [1, 2, 3])
    const rowEl = makeRow()
    onRowMouseDown(1, 0, mousedown(rowEl))
    const clone = document.querySelector('table.layer')
    expect(clone).not.toBeNull()
    expect(clone?.querySelector('.dragclone')).not.toBeNull()
    onRowMouseUp(1)
    expect(document.querySelector('table.layer')).toBeNull()
  })

  it('drops at the end when the mouse button is released off any row (document fallback)', () => {
    const onMove = vi.fn()
    const { onRowMouseDown, dragOverIndex } = useRowDrag(() => [1, 2, 3], onMove)
    onRowMouseDown(1, 0, mousedown(makeRow()))
    document.dispatchEvent(new MouseEvent('mouseup'))
    expect(onMove).toHaveBeenCalledWith(1, undefined)
    expect(dragOverIndex.value).toBeNull()
  })
})
