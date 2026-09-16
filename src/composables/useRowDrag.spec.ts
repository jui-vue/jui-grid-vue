import { describe, expect, it, vi } from 'vitest'
import { useRowDrag } from './useRowDrag'

describe('useRowDrag', () => {
  it('invokes onMove with the source and target ids on drop', () => {
    const onMove = vi.fn()
    const { onDragStart, onDrop } = useRowDrag(onMove)
    onDragStart(1)
    onDrop(3)
    expect(onMove).toHaveBeenCalledWith(1, 3)
  })

  it('does not call onMove when dropping on the same row', () => {
    const onMove = vi.fn()
    const { onDragStart, onDrop } = useRowDrag(onMove)
    onDragStart(1)
    onDrop(1)
    expect(onMove).not.toHaveBeenCalled()
  })

  it('does not call onMove when nothing was dragged', () => {
    const onMove = vi.fn()
    const { onDrop } = useRowDrag(onMove)
    onDrop(1)
    expect(onMove).not.toHaveBeenCalled()
  })

  it('tracks dragOverId while hovering and clears it on drop', () => {
    const { onDragStart, onDragOver, onDrop, dragOverId } = useRowDrag()
    onDragStart(1)
    onDragOver(2)
    expect(dragOverId.value).toBe(2)
    onDrop(2)
    expect(dragOverId.value).toBeNull()
  })

  it('onDragEnd resets drag state without firing onMove', () => {
    const onMove = vi.fn()
    const { onDragStart, onDragOver, onDragEnd, dragOverId } = useRowDrag(onMove)
    onDragStart(1)
    onDragOver(2)
    onDragEnd()
    expect(dragOverId.value).toBeNull()
    expect(onMove).not.toHaveBeenCalled()
  })
})
