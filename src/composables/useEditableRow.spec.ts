import { describe, expect, it, vi } from 'vitest'
import { useEditableRow } from './useEditableRow'
import type { GridRow } from '../types'

function makeRow(): GridRow {
  return { id: 1, data: { name: 'apple', qty: 3 } }
}

describe('useEditableRow', () => {
  it('seeds the draft from the row being edited', () => {
    const { startEdit, draft, isEditing } = useEditableRow()
    const row = makeRow()
    startEdit(row)
    expect(isEditing(1)).toBe(true)
    expect(draft).toEqual({ name: 'apple', qty: 3 })
  })

  it('cancelEdit stops editing without invoking the commit callback', () => {
    const onCommit = vi.fn()
    const { startEdit, cancelEdit, isEditing } = useEditableRow(onCommit)
    const row = makeRow()
    startEdit(row)
    cancelEdit()
    expect(isEditing(1)).toBe(false)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commitEdit invokes the callback with the edited draft and stops editing', () => {
    const onCommit = vi.fn()
    const { startEdit, commitEdit, draft, isEditing } = useEditableRow(onCommit)
    const row = makeRow()
    startEdit(row)
    draft.qty = 99
    commitEdit(row)

    expect(onCommit).toHaveBeenCalledWith(row, { name: 'apple', qty: 99 })
    expect(isEditing(1)).toBe(false)
  })

  it('commitEdit is a no-op if the row is not the one being edited', () => {
    const onCommit = vi.fn()
    const { startEdit, commitEdit } = useEditableRow(onCommit)
    startEdit(makeRow())
    commitEdit({ id: 2, data: {} })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('starting a new edit replaces the previous draft entirely', () => {
    const { startEdit, draft } = useEditableRow()
    startEdit({ id: 1, data: { a: 1, b: 2 } })
    startEdit({ id: 2, data: { c: 3 } })
    expect(draft).toEqual({ c: 3 })
  })
})
