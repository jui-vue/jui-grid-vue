export type RowId = string | number

export interface GridColumn {
  /** Key into each row's `data` object */
  key: string
  label?: string
  /** Fixed pixel width. Adjustable at runtime when resizable. */
  width?: number
  sortable?: boolean
  resizable?: boolean
  editable?: boolean
  align?: 'left' | 'center' | 'right'
  /** Initial show/hide state when a column-visibility menu is used. Defaults to true. */
  visible?: boolean
}

export interface GridRow<T = Record<string, any>> {
  id: RowId
  data: T
  children?: GridRow<T>[]
}

export type SortOrder = 'asc' | 'desc'

export interface SortState {
  key: string | null
  order: SortOrder
}

/** A row flattened out of the tree for rendering, carrying its depth and fold state. */
export interface FlatRow<T = Record<string, any>> {
  row: GridRow<T>
  depth: number
  hasChildren: boolean
  expanded: boolean
}
