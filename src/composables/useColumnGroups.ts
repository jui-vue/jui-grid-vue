import { computed, type Ref } from 'vue'
import type { GridColumn } from '../types'

export interface HeaderCell {
  column: GridColumn
  colspan: number
  rowspan: number
  isLeaf: boolean
  /** Index into the flat leaf/visibleColumns array - only set when isLeaf is true. */
  leafIndex?: number
}

function isGroup(column: GridColumn): boolean {
  return !!column.children && column.children.length > 0
}

/** Depth-first flatten: only leaf (non-group) columns, in left-to-right order. */
export function flattenLeafColumns(tree: GridColumn[]): GridColumn[] {
  const leaves: GridColumn[] = []

  function walk(node: GridColumn) {
    if (isGroup(node)) node.children!.forEach(walk)
    else leaves.push(node)
  }

  tree.forEach(walk)
  return leaves
}

/**
 * Builds the header as one row per depth level, matching the classic HTML grouped-header
 * pattern: an ungrouped/leaf column gets rowspan down to the bottom row, a group column
 * gets colspan across however many of its leaf descendants are currently visible (0 -> the
 * whole group header cell is omitted).
 */
export function computeHeaderRows(tree: GridColumn[], isVisible: (key: string) => boolean): HeaderCell[][] {
  function visibleLeafCount(node: GridColumn): number {
    if (!isGroup(node)) return isVisible(node.key) ? 1 : 0
    return node.children!.reduce((sum, c) => sum + visibleLeafCount(c), 0)
  }

  function subtreeDepth(node: GridColumn): number {
    if (!isGroup(node)) return 1
    return 1 + Math.max(...node.children!.map(subtreeDepth))
  }

  const totalDepth = tree.length === 0 ? 1 : Math.max(1, ...tree.map(subtreeDepth))
  const rows: HeaderCell[][] = Array.from({ length: totalDepth }, () => [])
  let leafCursor = 0

  function walk(node: GridColumn, rowIndex: number) {
    const count = visibleLeafCount(node)
    if (count === 0) return

    if (isGroup(node)) {
      rows[rowIndex].push({ column: node, colspan: count, rowspan: 1, isLeaf: false })
      node.children!.forEach((child) => walk(child, rowIndex + 1))
    } else {
      rows[rowIndex].push({ column: node, colspan: 1, rowspan: totalDepth - rowIndex, isLeaf: true, leafIndex: leafCursor })
      leafCursor++
    }
  }

  tree.forEach((node) => walk(node, 0))
  return rows
}

export function useColumnGroups(tree: Ref<GridColumn[]>, isVisible: (key: string) => boolean) {
  const headerRows = computed(() => computeHeaderRows(tree.value, isVisible))
  const headerRowCount = computed(() => headerRows.value.length)

  return { headerRows, headerRowCount }
}
