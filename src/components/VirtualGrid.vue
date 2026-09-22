<script setup lang="ts">
import { computed, nextTick, toRef } from 'vue'
import type { GridColumn, GridRow, RowId } from '../types'
import type { SortCriterion } from '../composables/useMultiSort'
import { useMultiSort } from '../composables/useMultiSort'
import { useColumns } from '../composables/useColumns'
import { useColumnResize } from '../composables/useColumnResize'
import { useRowSelection } from '../composables/useRowSelection'
import { useExpandRow } from '../composables/useExpandRow'
import { useEditableRow } from '../composables/useEditableRow'
import { useTreeRows } from '../composables/useTreeRows'
import { useFilter, type FilterPredicate } from '../composables/useFilter'
import { usePaging } from '../composables/usePaging'
import { useVirtualScroll } from '../composables/useVirtualScroll'
import { useLoading } from '../composables/useLoading'
import { rowsToCsv, downloadCsv, csvToRowData } from '../composables/useCsv'
import { flattenLeafColumns, useColumnGroups } from '../composables/useColumnGroups'
import ColumnMenu from './ColumnMenu.vue'

const props = withDefaults(
  defineProps<{
    columns: GridColumn[]
    rows: GridRow[]
    /** 'virtual' windows a large flat/tree row list; 'paging' slices it into fixed-size pages. */
    mode?: 'virtual' | 'paging'
    rowHeight?: number
    height?: number
    pageSize?: number
    /** Shows the built-in Prev/Page N/Next pager below the table in 'paging' mode. */
    showPager?: boolean
    sortable?: boolean
    resizable?: boolean
    selectable?: boolean
    checkable?: boolean
    expandable?: boolean
    editable?: boolean
    columnMenu?: boolean
    theme?: 'classic' | 'dark'
    /** table.less/table.theme.less variant class (jui-grid's own table style options). */
    variant?: 'classic' | 'simple' | 'expand'
    /** `.headline` modifier for the `simple` variant - a border between header cells. */
    headline?: boolean
    loading?: boolean
    /** Total table width in px (jui-grid's `width` config). */
    width?: number
    /** Initial multi-sort criteria (jui-grid's `sortIndex`/`sortOrder`). */
    initialSort?: SortCriterion[]
    /**
     * Shows the loading overlay while a (potentially expensive) sort runs, by deferring the
     * actual sort to the next animation frame so the overlay paints first. `true` shows it
     * immediately; a number delays showing it by that many ms (jui-grid's `sortLoading`).
     */
    sortLoading?: boolean | number
  }>(),
  {
    mode: 'virtual',
    rowHeight: 32,
    height: 400,
    pageSize: 50,
    showPager: true,
    sortable: false,
    resizable: false,
    selectable: false,
    checkable: false,
    expandable: false,
    editable: false,
    columnMenu: false,
    theme: 'classic',
    variant: 'classic',
    headline: false,
    loading: false,
    width: undefined,
    initialSort: undefined,
    sortLoading: false,
  },
)

const emit = defineEmits<{
  sort: [criteria: SortCriterion[]]
  'row-click': [row: GridRow, e: MouseEvent | KeyboardEvent]
  'row-dblclick': [row: GridRow, e: MouseEvent]
  'row-contextmenu': [row: GridRow, e: MouseEvent]
  'update:selected': [id: RowId | null]
  'update:checked': [ids: RowId[]]
  'column-resize': [column: GridColumn]
  'update:columns': [columns: GridColumn[]]
  'row-edit': [row: GridRow, data: Record<string, any>]
  'edit-start': [row: GridRow]
  expand: [row: GridRow]
  collapse: [row: GridRow]
  'col-show': [column: GridColumn]
  'col-hide': [column: GridColumn]
  'open-all': []
  'fold-all': []
  'import-csv': [rows: Record<string, string>[]]
  'page-change': [page: number]
}>()

const columnsRef = toRef(props, 'columns')
const rowsRef = toRef(props, 'rows')
const leafColumnDefs = computed(() => flattenLeafColumns(props.columns))

function toPlainColumns(): GridColumn[] {
  return columnState.map((c) => ({
    key: c.key,
    label: c.label,
    width: c.width,
    sortable: c.sortable,
    resizable: c.resizable,
    editable: c.editable,
    align: c.align,
    visible: c.visible,
  }))
}

const {
  state: columnState,
  visibleColumns,
  toggleColumn,
  showColumn,
  hideColumn,
  initColumns,
} = useColumns(leafColumnDefs, (col) => {
  emit('update:columns', toPlainColumns())
  if (col.visible) emit('col-show', col)
  else emit('col-hide', col)
})

const { headerRows } = useColumnGroups(columnsRef, (key) => columnState.find((c) => c.key === key)?.visible ?? true)

const { filteredRows, setFilter, clearFilter, hasFilter } = useFilter(rowsRef)

const {
  criteria: sortCriteria,
  sortedRows,
  toggleSort,
  orderOf,
  priorityOf,
} = useMultiSort(filteredRows, (c) => emit('sort', c), props.initialSort)

const { flatRows, toggle: toggleTree, open: openTreeRow, fold: foldTreeRow, openAll: openAllRows, foldAll: foldAllRows } = useTreeRows(sortedRows)

function openAll() {
  openAllRows()
  emit('open-all')
}

function foldAll() {
  foldAllRows()
  emit('fold-all')
}

const totalRowCount = computed(() => flatRows.value.length)

const rowHeightRef = toRef(props, 'rowHeight')
const { containerRef, onScroll, range, scrollToIndex } = useVirtualScroll(totalRowCount, rowHeightRef, 6)

const paging = usePaging(
  flatRows,
  computed(() => props.pageSize),
)

const visibleFlatRows = computed(() => {
  if (props.mode === 'paging') return paging.pageRows.value
  return flatRows.value.slice(range.value.startIndex, range.value.endIndex)
})

const { selectedId, select, unselect, isSelected, check, uncheck, isChecked, toggleCheck, uncheckAll, checkedIds } = useRowSelection()

function listChecked(): RowId[] {
  return [...checkedIds]
}

const { expandedId, showExpand, hideExpand, isExpanded } = useExpandRow()

function getExpand(): GridRow | null {
  if (expandedId.value == null) return null
  return flatRows.value.find((f) => f.row.id === expandedId.value)?.row ?? null
}

const { editingId, draft, startEdit, cancelEdit, commitEdit, isEditing } = useEditableRow((row, data) => {
  Object.assign(row.data, data)
  emit('row-edit', row, data)
})

function startEditRow(row: GridRow) {
  startEdit(row)
  emit('edit-start', row)
}

function showEditRow(id: RowId) {
  const row = flatRows.value.find((f) => f.row.id === id)?.row
  if (row) startEditRow(row)
}

function getEditRow(): GridRow | null {
  if (editingId.value == null) return null
  return flatRows.value.find((f) => f.row.id === editingId.value)?.row ?? null
}

function activeIndex(): RowId | null {
  return expandedId.value ?? selectedId.value ?? editingId.value ?? null
}

const { onResizeStart } = useColumnResize(
  (key) => columnState.find((c) => c.key === key)?.width ?? 120,
  (key, width) => {
    const col = columnState.find((c) => c.key === key)
    if (col) col.width = width
  },
  (column) => emit('column-resize', column),
)

const { isLoading: internalLoading, showLoading, hideLoading } = useLoading()
const isLoadingVisible = computed(() => props.loading || internalLoading.value)

const totalColumnCount = computed(() => visibleColumns.value.length + (props.checkable ? 1 : 0))

function isSortable(column: GridColumn) {
  return props.sortable && column.sortable !== false
}

function isResizable(column: GridColumn) {
  return props.resizable && column.resizable !== false
}

function isEditableColumn(column: GridColumn) {
  return props.editable && column.editable === true
}

function onHeaderClick(column: GridColumn, e: MouseEvent) {
  if (!isSortable(column)) return

  const shiftKey = e.shiftKey
  if (props.sortLoading) {
    // Show the overlay immediately, then let a paint happen before running the
    // (synchronous, potentially expensive) sort - not delaying the overlay itself.
    showLoading()
    const delay = props.sortLoading === true ? 500 : props.sortLoading
    requestAnimationFrame(() => {
      setTimeout(() => {
        toggleSort(column.key, shiftKey)
        nextTick(hideLoading)
      }, delay)
    })
  } else {
    toggleSort(column.key, shiftKey)
  }
}

function ariaSort(column: GridColumn): 'ascending' | 'descending' | 'none' | undefined {
  if (!isSortable(column)) return undefined
  const order = orderOf(column.key)
  if (!order) return 'none'
  return order === 'asc' ? 'ascending' : 'descending'
}

function activateRow(row: GridRow, e: MouseEvent | KeyboardEvent) {
  if (props.selectable) {
    select(row.id)
    emit('update:selected', row.id)
  }
  emit('row-click', row, e)
}

function onRowClick(row: GridRow, e: MouseEvent) {
  activateRow(row, e)
}

function onRowKeydown(e: KeyboardEvent, row: GridRow) {
  if (e.key === 'Enter') {
    activateRow(row, e)
  } else if (e.key === ' ' && props.checkable) {
    e.preventDefault()
    onToggleCheck(row.id)
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const current = e.currentTarget as HTMLElement
    let next = e.key === 'ArrowDown' ? current.nextElementSibling : current.previousElementSibling
    while (next && !next.matches('[role="row"][tabindex]')) {
      next = e.key === 'ArrowDown' ? next.nextElementSibling : next.previousElementSibling
    }
    if (next instanceof HTMLElement) {
      e.preventDefault()
      next.focus()
    }
  }
}

function onToggleCheck(id: RowId) {
  toggleCheck(id)
  emit('update:checked', [...checkedIds])
}

function onRowDblClick(row: GridRow, e: MouseEvent) {
  emit('row-dblclick', row, e)
}

function onRowContextMenu(row: GridRow, e: MouseEvent) {
  emit('row-contextmenu', row, e)
}

function onCellDblClick(row: GridRow, column: GridColumn) {
  if (isEditableColumn(column)) {
    startEditRow(row)
  } else if (props.expandable) {
    toggleExpandRow(row)
  }
}

function toggleExpandRow(row: GridRow) {
  if (isExpanded(row.id)) {
    hideExpand()
    emit('collapse', row)
  } else {
    showExpand(row.id)
    emit('expand', row)
  }
}

function rowClasses(flat: { row: GridRow }) {
  return {
    selected: props.selectable && isSelected(flat.row.id),
    open: props.expandable && isExpanded(flat.row.id),
  }
}

function getCsv() {
  return rowsToCsv(visibleColumns.value, flatRows.value.map((f) => f.row))
}

function exportCsv(filename = 'table.csv') {
  downloadCsv(filename, getCsv())
}

function goToPage(page: number) {
  paging.goToPage(page)
  emit('page-change', paging.currentPage.value)
}

function getPage() {
  return paging.currentPage.value
}

function setCsv(csv: string) {
  emit('import-csv', csvToRowData(csv, visibleColumns.value))
}

function setCsvFile(file: File) {
  const reader = new FileReader()
  reader.onload = () => setCsv(String(reader.result ?? ''))
  reader.readAsText(file)
}

defineExpose({
  open: openTreeRow,
  fold: foldTreeRow,
  toggle: toggleTree,
  openAll,
  foldAll,
  select,
  unselect,
  check,
  uncheck,
  uncheckAll,
  listChecked,
  showColumn,
  hideColumn,
  initColumns,
  showExpand,
  hideExpand,
  getExpand,
  showEditRow,
  hideEditRow: cancelEdit,
  getEditRow,
  activeIndex,
  getCsv,
  exportCsv,
  setCsv,
  setCsvFile,
  setFilter: (fn: FilterPredicate | null) => setFilter(fn),
  clearFilter,
  showLoading,
  hideLoading,
  scrollToIndex,
  goToPage,
  getPage,
})
</script>

<template>
  <div class="jui-grid-vue-root" :class="`theme-${theme}`">
    <ColumnMenu v-if="columnMenu" :columns="columnState" @toggle="toggleColumn" />
    <div v-if="isLoadingVisible" class="loading-overlay" role="status" aria-live="polite">
      <slot name="loading">Loading…</slot>
    </div>
    <div
      v-if="mode === 'virtual'"
      :ref="(el: any) => (containerRef = el)"
      class="scroll-container"
      :style="{ height: height + 'px', overflow: 'auto' }"
      @scroll="onScroll"
    >
      <table class="table has-scroll" :class="[variant, { headline }]" :style="width ? { width: width + 'px' } : undefined" role="grid">
        <colgroup>
          <col v-if="checkable" style="width: 28px" />
          <col v-for="column in visibleColumns" :key="column.key" :style="{ width: column.width ? column.width + 'px' : undefined }" />
        </colgroup>
        <thead>
          <tr v-for="(headerRow, rowIndex) in headerRows" :key="rowIndex" role="row">
            <th v-if="rowIndex === 0 && checkable" class="col-check" role="columnheader" :rowspan="headerRows.length"></th>
            <th
              v-for="cell in headerRow"
              :key="cell.column.key"
              role="columnheader"
              :colspan="cell.colspan > 1 ? cell.colspan : undefined"
              :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
              :class="{ sortable: cell.isLeaf && isSortable(cell.column) }"
              :aria-sort="cell.isLeaf ? ariaSort(cell.column) : undefined"
              :tabindex="cell.isLeaf && isSortable(cell.column) ? 0 : undefined"
              @click="cell.isLeaf && onHeaderClick(cell.column, $event)"
              @keydown.enter="cell.isLeaf && onHeaderClick(cell.column, $event as unknown as MouseEvent)"
            >
              <slot v-if="cell.isLeaf" :name="`header-${cell.column.key}`" :column="cell.column">{{ cell.column.label ?? cell.column.key }}</slot>
              <template v-else>{{ cell.column.label ?? cell.column.key }}</template>
              <span v-if="cell.isLeaf && orderOf(cell.column.key)" class="sort-indicator" aria-hidden="true">
                {{ orderOf(cell.column.key) === 'asc' ? '▲' : '▼' }}<sup v-if="sortCriteria.length > 1">{{ priorityOf(cell.column.key) }}</sup>
              </span>
              <div
                v-if="cell.isLeaf && isResizable(cell.column) && cell.leafIndex! < visibleColumns.length - 1"
                class="resize"
                @mousedown="onResizeStart($event, cell.column, visibleColumns[cell.leafIndex! + 1])"
              ></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="range.topSpacerHeight > 0" class="spacer" aria-hidden="true" :style="{ height: range.topSpacerHeight + 'px' }">
            <td :colspan="totalColumnCount" :style="{ padding: 0, border: 'none' }"></td>
          </tr>
          <tr v-if="totalRowCount === 0" role="row">
            <td class="none" role="gridcell" style="text-align: center;" :colspan="totalColumnCount">
              <slot name="empty">Data does not exist.</slot>
            </td>
          </tr>
          <template v-for="flat in visibleFlatRows" :key="flat.row.id">
            <tr
              role="row"
              :class="rowClasses(flat)"
              :style="{ height: rowHeight + 'px' }"
              :tabindex="selectable || checkable ? 0 : undefined"
              :aria-selected="selectable ? isSelected(flat.row.id) : undefined"
              @click="onRowClick(flat.row, $event)"
              @keydown="onRowKeydown($event, flat.row)"
              @dblclick="onRowDblClick(flat.row, $event)"
              @contextmenu.prevent="onRowContextMenu(flat.row, $event)"
            >
              <td v-if="checkable" class="col-check" role="gridcell" @click.stop>
                <input type="checkbox" :checked="isChecked(flat.row.id)" @change="onToggleCheck(flat.row.id)" />
              </td>
              <td
                v-for="(column, colIndex) in visibleColumns"
                :key="column.key"
                role="gridcell"
                :style="{ textAlign: column.align }"
                @dblclick="onCellDblClick(flat.row, column)"
              >
                <input
                  v-if="isEditing(flat.row.id) && isEditableColumn(column)"
                  class="edit"
                  v-model="draft[column.key]"
                  @keyup.enter="commitEdit(flat.row)"
                  @blur="commitEdit(flat.row)"
                  @click.stop
                />
                <template v-else>
                  <button
                    v-if="colIndex === 0 && flat.hasChildren"
                    type="button"
                    class="tree-toggle"
                    :style="{ marginLeft: flat.depth * 16 + 'px' }"
                    :aria-expanded="flat.expanded"
                    :aria-label="flat.expanded ? 'Collapse row' : 'Expand row'"
                    @click.stop="toggleTree(flat.row.id)"
                    >{{ flat.expanded ? '▾' : '▸' }}</button
                  >
                  <slot :name="`cell-${column.key}`" :row="flat.row" :value="flat.row.data[column.key]" :column="column">{{
                    flat.row.data[column.key]
                  }}</slot>
                </template>
              </td>
            </tr>
            <tr v-if="expandable && isExpanded(flat.row.id)" class="expand">
              <td :colspan="totalColumnCount">
                <slot name="expand" :row="flat.row">{{ flat.row.data }}</slot>
              </td>
            </tr>
          </template>
          <tr v-if="range.bottomSpacerHeight > 0" class="spacer" aria-hidden="true" :style="{ height: range.bottomSpacerHeight + 'px' }">
            <td :colspan="totalColumnCount" :style="{ padding: 0, border: 'none' }"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <template v-else>
      <table class="table" :class="[variant, { headline }]" :style="width ? { width: width + 'px' } : undefined" role="grid">
        <colgroup>
          <col v-if="checkable" style="width: 28px" />
          <col v-for="column in visibleColumns" :key="column.key" :style="{ width: column.width ? column.width + 'px' : undefined }" />
        </colgroup>
        <thead>
          <tr v-for="(headerRow, rowIndex) in headerRows" :key="rowIndex" role="row">
            <th v-if="rowIndex === 0 && checkable" class="col-check" role="columnheader" :rowspan="headerRows.length"></th>
            <th
              v-for="cell in headerRow"
              :key="cell.column.key"
              role="columnheader"
              :colspan="cell.colspan > 1 ? cell.colspan : undefined"
              :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
              :class="{ sortable: cell.isLeaf && isSortable(cell.column) }"
              :aria-sort="cell.isLeaf ? ariaSort(cell.column) : undefined"
              :tabindex="cell.isLeaf && isSortable(cell.column) ? 0 : undefined"
              @click="cell.isLeaf && onHeaderClick(cell.column, $event)"
              @keydown.enter="cell.isLeaf && onHeaderClick(cell.column, $event as unknown as MouseEvent)"
            >
              <slot v-if="cell.isLeaf" :name="`header-${cell.column.key}`" :column="cell.column">{{ cell.column.label ?? cell.column.key }}</slot>
              <template v-else>{{ cell.column.label ?? cell.column.key }}</template>
              <span v-if="cell.isLeaf && orderOf(cell.column.key)" class="sort-indicator" aria-hidden="true">
                {{ orderOf(cell.column.key) === 'asc' ? '▲' : '▼' }}<sup v-if="sortCriteria.length > 1">{{ priorityOf(cell.column.key) }}</sup>
              </span>
              <div
                v-if="cell.isLeaf && isResizable(cell.column) && cell.leafIndex! < visibleColumns.length - 1"
                class="resize"
                @mousedown="onResizeStart($event, cell.column, visibleColumns[cell.leafIndex! + 1])"
              ></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="totalRowCount === 0" role="row">
            <td class="none" role="gridcell" style="text-align: center;" :colspan="totalColumnCount">
              <slot name="empty">Data does not exist.</slot>
            </td>
          </tr>
          <template v-for="flat in visibleFlatRows" :key="flat.row.id">
            <tr
              role="row"
              :class="rowClasses(flat)"
              :tabindex="selectable || checkable ? 0 : undefined"
              :aria-selected="selectable ? isSelected(flat.row.id) : undefined"
              @click="onRowClick(flat.row, $event)"
              @keydown="onRowKeydown($event, flat.row)"
              @dblclick="onRowDblClick(flat.row, $event)"
              @contextmenu.prevent="onRowContextMenu(flat.row, $event)"
            >
              <td v-if="checkable" class="col-check" role="gridcell" @click.stop>
                <input type="checkbox" :checked="isChecked(flat.row.id)" @change="onToggleCheck(flat.row.id)" />
              </td>
              <td
                v-for="(column, colIndex) in visibleColumns"
                :key="column.key"
                role="gridcell"
                :style="{ textAlign: column.align }"
                @dblclick="onCellDblClick(flat.row, column)"
              >
                <input
                  v-if="isEditing(flat.row.id) && isEditableColumn(column)"
                  class="edit"
                  v-model="draft[column.key]"
                  @keyup.enter="commitEdit(flat.row)"
                  @blur="commitEdit(flat.row)"
                  @click.stop
                />
                <template v-else>
                  <button
                    v-if="colIndex === 0 && flat.hasChildren"
                    type="button"
                    class="tree-toggle"
                    :style="{ marginLeft: flat.depth * 16 + 'px' }"
                    :aria-expanded="flat.expanded"
                    :aria-label="flat.expanded ? 'Collapse row' : 'Expand row'"
                    @click.stop="toggleTree(flat.row.id)"
                    >{{ flat.expanded ? '▾' : '▸' }}</button
                  >
                  <slot :name="`cell-${column.key}`" :row="flat.row" :value="flat.row.data[column.key]" :column="column">{{
                    flat.row.data[column.key]
                  }}</slot>
                </template>
              </td>
            </tr>
            <tr v-if="expandable && isExpanded(flat.row.id)" class="expand">
              <td :colspan="totalColumnCount">
                <slot name="expand" :row="flat.row">{{ flat.row.data }}</slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div v-if="showPager" class="pager">
        <button type="button" :disabled="paging.currentPage.value <= 1" @click="goToPage(paging.currentPage.value - 1)">Prev</button>
        <span>Page {{ paging.currentPage.value }} / {{ paging.pageCount.value }}</span>
        <button type="button" :disabled="paging.currentPage.value >= paging.pageCount.value" @click="goToPage(paging.currentPage.value + 1)">Next</button>
      </div>
    </template>

    <div v-if="hasFilter" class="filter-badge">Filtered ({{ flatRows.length }} rows)</div>
  </div>
</template>

<style scoped>
.jui-grid-vue-root {
  position: relative;
}

th {
  position: relative;
}

.scroll-container {
  position: relative;
}

/* .table.has-scroll thead th의 position:sticky는 table.less(전역)로 옮겼다. */

th.sortable {
  cursor: pointer;
  user-select: none;
}

.sort-indicator {
  margin-left: 4px;
  font-size: 10px;
}

.resize {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 1;
}

.tree-toggle {
  display: inline-block;
  width: 14px;
  cursor: pointer;
  user-select: none;
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  line-height: 1;
  vertical-align: middle;
  color: inherit;
}

.col-check {
  width: 28px;
  text-align: center;
}

tbody tr[tabindex]:focus-visible,
thead th[tabindex]:focus-visible,
.tree-toggle:focus-visible {
  outline: 2px solid #8945ee;
  outline-offset: -2px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.pager {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  font-size: 12px;
}

.filter-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: 11px;
  opacity: 0.7;
}
</style>
