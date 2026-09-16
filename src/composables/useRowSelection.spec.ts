import { describe, expect, it } from 'vitest'
import { useRowSelection } from './useRowSelection'

describe('useRowSelection', () => {
  it('selects a single row at a time', () => {
    const { select, isSelected } = useRowSelection()
    select(1)
    expect(isSelected(1)).toBe(true)
    select(2)
    expect(isSelected(1)).toBe(false)
    expect(isSelected(2)).toBe(true)
  })

  it('unselect clears the selection', () => {
    const { select, unselect, isSelected } = useRowSelection()
    select(1)
    unselect()
    expect(isSelected(1)).toBe(false)
  })

  it('supports multiple independent checked rows', () => {
    const { check, uncheck, isChecked } = useRowSelection()
    check(1)
    check(2)
    expect(isChecked(1)).toBe(true)
    expect(isChecked(2)).toBe(true)
    uncheck(1)
    expect(isChecked(1)).toBe(false)
    expect(isChecked(2)).toBe(true)
  })

  it('toggleCheck flips the checked state', () => {
    const { toggleCheck, isChecked } = useRowSelection()
    toggleCheck(1)
    expect(isChecked(1)).toBe(true)
    toggleCheck(1)
    expect(isChecked(1)).toBe(false)
  })

  it('uncheckAll clears every checked row', () => {
    const { check, uncheckAll, isChecked } = useRowSelection()
    check(1)
    check(2)
    uncheckAll()
    expect(isChecked(1)).toBe(false)
    expect(isChecked(2)).toBe(false)
  })

  it('selection and check state are independent of each other', () => {
    const { select, check, isSelected, isChecked } = useRowSelection()
    select(1)
    check(1)
    expect(isSelected(1)).toBe(true)
    expect(isChecked(1)).toBe(true)
  })
})
