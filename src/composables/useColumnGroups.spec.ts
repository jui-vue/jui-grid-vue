import { describe, expect, it } from 'vitest'
import { computeHeaderRows, flattenLeafColumns } from './useColumnGroups'
import type { GridColumn } from '../types'

const allVisible = () => true

describe('flattenLeafColumns', () => {
  it('returns a flat, ungrouped tree unchanged', () => {
    const tree: GridColumn[] = [{ key: 'a' }, { key: 'b' }]
    expect(flattenLeafColumns(tree).map((c) => c.key)).toEqual(['a', 'b'])
  })

  it('flattens nested groups in left-to-right depth-first order', () => {
    const tree: GridColumn[] = [
      { key: 'a' },
      { key: 'group1', children: [{ key: 'b' }, { key: 'c' }] },
      { key: 'd' },
    ]
    expect(flattenLeafColumns(tree).map((c) => c.key)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('flattens groups nested inside groups', () => {
    const tree: GridColumn[] = [{ key: 'outer', children: [{ key: 'inner', children: [{ key: 'x' }, { key: 'y' }] }, { key: 'z' }] }]
    expect(flattenLeafColumns(tree).map((c) => c.key)).toEqual(['x', 'y', 'z'])
  })
})

describe('computeHeaderRows', () => {
  it('produces a single row of rowspan-1 leaves when nothing is grouped', () => {
    const tree: GridColumn[] = [{ key: 'a' }, { key: 'b' }]
    const rows = computeHeaderRows(tree, allVisible)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual([
      { column: tree[0], colspan: 1, rowspan: 1, isLeaf: true, leafIndex: 0 },
      { column: tree[1], colspan: 1, rowspan: 1, isLeaf: true, leafIndex: 1 },
    ])
  })

  it('gives an ungrouped column alongside a group a rowspan down to the bottom row', () => {
    const tree: GridColumn[] = [{ key: 'a' }, { key: 'group', children: [{ key: 'b' }, { key: 'c' }] }]
    const rows = computeHeaderRows(tree, allVisible)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual([
      { column: tree[0], colspan: 1, rowspan: 2, isLeaf: true, leafIndex: 0 },
      { column: tree[1], colspan: 2, rowspan: 1, isLeaf: false },
    ])
    expect(rows[1]).toEqual([
      { column: tree[1].children![0], colspan: 1, rowspan: 1, isLeaf: true, leafIndex: 1 },
      { column: tree[1].children![1], colspan: 1, rowspan: 1, isLeaf: true, leafIndex: 2 },
    ])
  })

  it('colspan reflects only the currently visible leaves under a group', () => {
    const tree: GridColumn[] = [{ key: 'group', children: [{ key: 'b' }, { key: 'c' }, { key: 'd' }] }]
    const rows = computeHeaderRows(tree, (key) => key !== 'c')
    expect(rows[0][0]).toMatchObject({ colspan: 2, isLeaf: false })
    expect(rows[1].map((c) => c.column.key)).toEqual(['b', 'd'])
  })

  it('omits a group header entirely once every one of its leaves is hidden', () => {
    const tree: GridColumn[] = [{ key: 'a' }, { key: 'group', children: [{ key: 'b' }, { key: 'c' }] }]
    const rows = computeHeaderRows(tree, (key) => key !== 'b' && key !== 'c')
    expect(rows[0].map((c) => c.column.key)).toEqual(['a'])
    expect(rows[1]).toEqual([])
  })

  it('handles three levels of nested groups, each leaf rowspan reaching the bottom', () => {
    const tree: GridColumn[] = [{ key: 'outer', children: [{ key: 'inner', children: [{ key: 'x' }] }] }]
    const rows = computeHeaderRows(tree, allVisible)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual([{ column: tree[0], colspan: 1, rowspan: 1, isLeaf: false }])
    expect(rows[1]).toEqual([{ column: tree[0].children![0], colspan: 1, rowspan: 1, isLeaf: false }])
    expect(rows[2]).toEqual([{ column: tree[0].children![0].children![0], colspan: 1, rowspan: 1, isLeaf: true, leafIndex: 0 }])
  })

  it('assigns leafIndex in the same left-to-right order as flattenLeafColumns', () => {
    const tree: GridColumn[] = [{ key: 'a' }, { key: 'group', children: [{ key: 'b' }, { key: 'c' }] }, { key: 'd' }]
    const rows = computeHeaderRows(tree, allVisible)
    const leaves = rows.flat().filter((c) => c.isLeaf).sort((a, b) => a.leafIndex! - b.leafIndex!)
    expect(leaves.map((c) => c.column.key)).toEqual(flattenLeafColumns(tree).map((c) => c.key))
  })

  it('returns a single empty-ish row for an empty tree', () => {
    expect(computeHeaderRows([], allVisible)).toEqual([[]])
  })
})
