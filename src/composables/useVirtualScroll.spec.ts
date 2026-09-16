import { describe, expect, it } from 'vitest'
import { computeVirtualRange } from './useVirtualScroll'

describe('computeVirtualRange', () => {
  it('starts at the top with overscan applied downward only when scrollTop is 0', () => {
    const range = computeVirtualRange(0, 300, 30, 1000, 5)
    expect(range.startIndex).toBe(0)
    expect(range.topSpacerHeight).toBe(0)
  })

  it('advances the start index as scrollTop grows, minus overscan', () => {
    const range = computeVirtualRange(3000, 300, 30, 1000, 5)
    // floor(3000/30) = 100, minus overscan 5 = 95
    expect(range.startIndex).toBe(95)
    expect(range.topSpacerHeight).toBe(95 * 30)
  })

  it('never lets startIndex go negative near the top', () => {
    const range = computeVirtualRange(10, 300, 30, 1000, 5)
    expect(range.startIndex).toBe(0)
  })

  it('computes an endIndex covering the viewport plus overscan on both sides', () => {
    const range = computeVirtualRange(0, 300, 30, 1000, 5)
    // visible rows = ceil(300/30) = 10, + overscan*2 = 20
    expect(range.endIndex).toBe(20)
  })

  it('clamps endIndex and bottomSpacerHeight at the end of the row set', () => {
    const range = computeVirtualRange(29970, 300, 30, 1000, 5)
    expect(range.endIndex).toBe(1000)
    expect(range.bottomSpacerHeight).toBe(0)
  })

  it('returns an empty range for zero rows', () => {
    const range = computeVirtualRange(0, 300, 30, 0, 5)
    expect(range).toEqual({ startIndex: 0, endIndex: 0, topSpacerHeight: 0, bottomSpacerHeight: 0 })
  })

  it('total spacer height plus rendered rows accounts for the full row count', () => {
    const itemHeight = 30
    const rowCount = 1000
    const range = computeVirtualRange(5000, 300, itemHeight, rowCount, 5)
    const renderedCount = range.endIndex - range.startIndex
    const total = range.topSpacerHeight + renderedCount * itemHeight + range.bottomSpacerHeight
    expect(total).toBe(rowCount * itemHeight)
  })
})
