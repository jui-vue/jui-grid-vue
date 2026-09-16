import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useColumnResize } from './useColumnResize'
import type { GridColumn } from '../types'

const colA: GridColumn = { key: 'a', width: 100 }
const colB: GridColumn = { key: 'b', width: 100 }

function setup(onResizeEnd?: (c: GridColumn) => void) {
  const widths: Record<string, number> = { a: 100, b: 100 }
  const getWidth = (key: string) => widths[key]
  const setWidth = (key: string, w: number) => {
    widths[key] = w
  }

  let api!: ReturnType<typeof useColumnResize>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useColumnResize(getWidth, setWidth, onResizeEnd)
        return () => h('div')
      },
    }),
  )

  return { wrapper, widths, get onResizeStart() { return api.onResizeStart } }
}

function mouseEvent(type: string, pageX: number) {
  const e = new MouseEvent(type)
  Object.defineProperty(e, 'pageX', { value: pageX })
  return e
}

describe('useColumnResize', () => {
  it('grows the dragged column and shrinks its neighbor by the same amount', () => {
    const { onResizeStart, widths } = setup()
    onResizeStart(mouseEvent('mousedown', 100), colA, colB)
    window.dispatchEvent(mouseEvent('mousemove', 130))
    expect(widths.a).toBe(130)
    expect(widths.b).toBe(70)
    window.dispatchEvent(mouseEvent('mouseup', 130))
  })

  it('refuses to shrink a column below the minimum width', () => {
    const { onResizeStart, widths } = setup()
    onResizeStart(mouseEvent('mousedown', 100), colA, colB)
    window.dispatchEvent(mouseEvent('mousemove', 250)) // would shrink b to -50
    expect(widths.a).toBe(100)
    expect(widths.b).toBe(100)
    window.dispatchEvent(mouseEvent('mouseup', 250))
  })

  it('stops tracking mousemove after mouseup', () => {
    const { onResizeStart, widths } = setup()
    onResizeStart(mouseEvent('mousedown', 100), colA, colB)
    window.dispatchEvent(mouseEvent('mouseup', 100))
    window.dispatchEvent(mouseEvent('mousemove', 200))
    expect(widths.a).toBe(100)
    expect(widths.b).toBe(100)
  })

  it('calls onResizeEnd with the resized column when the drag finishes', () => {
    const onResizeEnd = vi.fn()
    const { onResizeStart } = setup(onResizeEnd)
    onResizeStart(mouseEvent('mousedown', 100), colA, colB)
    window.dispatchEvent(mouseEvent('mousemove', 120))
    window.dispatchEvent(mouseEvent('mouseup', 120))
    expect(onResizeEnd).toHaveBeenCalledWith(colA)
  })
})
