import { nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { usePaging } from './usePaging'
import type { GridRow } from '../types'

function makeRows(n: number): GridRow[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, data: { i } }))
}

describe('usePaging', () => {
  it('slices the first page by default', () => {
    const rows = ref(makeRows(25))
    const { pageRows, pageCount } = usePaging(rows, 10)
    expect(pageRows.value).toHaveLength(10)
    expect(pageRows.value[0].id).toBe(0)
    expect(pageCount.value).toBe(3)
  })

  it('goToPage clamps within [1, pageCount]', () => {
    const rows = ref(makeRows(25))
    const { pageRows, goToPage, currentPage } = usePaging(rows, 10)
    goToPage(3)
    expect(pageRows.value.map((r) => r.id)).toEqual([20, 21, 22, 23, 24])
    goToPage(99)
    expect(currentPage.value).toBe(3)
    goToPage(-5)
    expect(currentPage.value).toBe(1)
  })

  it('next/prev move one page at a time', () => {
    const rows = ref(makeRows(25))
    const { next, prev, currentPage } = usePaging(rows, 10)
    next()
    expect(currentPage.value).toBe(2)
    next()
    next() // clamps at 3
    expect(currentPage.value).toBe(3)
    prev()
    expect(currentPage.value).toBe(2)
  })

  it('always reports at least one page for an empty row set', () => {
    const rows = ref(makeRows(0))
    const { pageCount, pageRows } = usePaging(rows, 10)
    expect(pageCount.value).toBe(1)
    expect(pageRows.value).toEqual([])
  })

  it('clamps the current page back when the row set shrinks', async () => {
    const rows = ref(makeRows(25))
    const { goToPage, currentPage } = usePaging(rows, 10)
    goToPage(3)
    rows.value = makeRows(5)
    await nextTick()
    expect(currentPage.value).toBe(1)
  })
})
