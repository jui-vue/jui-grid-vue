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
  /**
   * Sub-columns grouped under this one. A column with `children` is a group header only
   * (spans them via colspan in the top header row) - `key` still must be unique but isn't
   * used as a data field, and sortable/resizable/editable/width/align/visible are ignored
   * on it (they apply to its leaf descendants instead).
   */
  children?: GridColumn[]
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
