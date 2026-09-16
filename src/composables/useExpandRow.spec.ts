import { describe, expect, it } from 'vitest'
import { useExpandRow } from './useExpandRow'

describe('useExpandRow', () => {
  it('only one row is expanded at a time', () => {
    const { showExpand, isExpanded } = useExpandRow()
    showExpand(1)
    expect(isExpanded(1)).toBe(true)
    showExpand(2)
    expect(isExpanded(1)).toBe(false)
    expect(isExpanded(2)).toBe(true)
  })

  it('hideExpand clears the expanded row', () => {
    const { showExpand, hideExpand, isExpanded } = useExpandRow()
    showExpand(1)
    hideExpand()
    expect(isExpanded(1)).toBe(false)
  })

  it('toggleExpand closes an already-expanded row', () => {
    const { toggleExpand, isExpanded } = useExpandRow()
    toggleExpand(1)
    expect(isExpanded(1)).toBe(true)
    toggleExpand(1)
    expect(isExpanded(1)).toBe(false)
  })
})
