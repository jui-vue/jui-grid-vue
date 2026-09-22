<script setup lang="ts">
import { computed, nextTick, onMounted, ref, toRef, watch } from 'vue'
import type { GridColumn, GridRow, RowId, SortOrder, SortState } from '../types'
import { useSort } from '../composables/useSort'
import { useColumns } from '../composables/useColumns'
import { useColumnResize } from '../composables/useColumnResize'
import { useRowSelection } from '../composables/useRowSelection'
import { useExpandRow } from '../composables/useExpandRow'
import { useEditableRow } from '../composables/useEditableRow'
import { useRowDrag } from '../composables/useRowDrag'
import { useTreeRows } from '../composables/useTreeRows'
import { useLoading } from '../composables/useLoading'
import { rowsToCsv, downloadCsv, csvToRowData } from '../composables/useCsv'
import { flattenLeafColumns, useColumnGroups } from '../composables/useColumnGroups'
import ColumnMenu from './ColumnMenu.vue'

const props = withDefaults(
  defineProps<{
    columns: GridColumn[]
    rows: GridRow[]
    sortable?: boolean
    resizable?: boolean
    selectable?: boolean
    checkable?: boolean
    expandable?: boolean
    editable?: boolean
    draggable?: boolean
    /** Shows the `::` drag-handle column when draggable. Set false for whole-row dragging with no visible handle. */
    dragHandle?: boolean
    scrollHeight?: number
    /** Built-in dropdown for toggling column visibility (top-right corner). */
    columnMenu?: boolean
    theme?: 'classic' | 'dark'
    /** table.less/table.theme.less variant class (jui-grid's own table style options). */
    variant?: 'classic' | 'simple' | 'expand'
    /** `.headline` modifier for the `simple` variant - a border between header cells. */
    headline?: boolean
    /** `.nowrap` modifier - cell content never wraps to a second line. */
    nowrap?: boolean
    /** Total table width in px (jui-grid's `width` config). */
    width?: number
    /** Initial sort column/order (jui-grid's `sortIndex`/`sortOrder`). */
    initialSort?: { key: string; order?: SortOrder }
    /**
     * Shows a loading overlay while a (potentially expensive) sort runs, by deferring the
     * actual sort to the next animation frame so the overlay paints first. `true` shows it
     * immediately; a number delays showing it by that many ms (jui-grid's `sortLoading`).
     */
    sortLoading?: boolean | number
  }>(),
  {
    sortable: false,
    resizable: false,
    selectable: false,
    checkable: false,
    expandable: false,
    editable: false,
    draggable: false,
    dragHandle: true,
    scrollHeight: undefined,
    columnMenu: false,
    theme: 'classic',
    variant: 'classic',
    headline: false,
    nowrap: false,
    width: undefined,
    initialSort: undefined,
    sortLoading: false,
  },
)

const emit = defineEmits<{
  sort: [state: SortState]
  'row-click': [row: GridRow, e: MouseEvent | KeyboardEvent]
  'row-dblclick': [row: GridRow, e: MouseEvent]
  'row-contextmenu': [row: GridRow, e: MouseEvent]
  'update:selected': [id: RowId | null]
  'update:checked': [ids: RowId[]]
  'column-resize': [column: GridColumn]
  'update:columns': [columns: GridColumn[]]
  'row-move': [fromId: RowId, toId: RowId]
  'row-edit': [row: GridRow, data: Record<string, any>]
  'edit-start': [row: GridRow]
  expand: [row: GridRow]
  collapse: [row: GridRow]
  'col-show': [column: GridColumn]
  'col-hide': [column: GridColumn]
  'open-all': []
  'fold-all': []
  'import-csv': [rows: Record<string, string>[]]
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

const { state: sortState, sortedRows, toggleSort } = useSort(
  rowsRef,
  (s) => emit('sort', s),
  props.initialSort ? { key: props.initialSort.key, order: props.initialSort.order ?? 'asc' } : undefined,
)

const sortedForTree = computed(() => sortedRows.value)
const { toggle: toggleTree, open: openTreeRow, fold: foldTreeRow, openAll: openAllRows, foldAll: foldAllRows, flatRows } = useTreeRows(sortedForTree)

function openAll() {
  openAllRows()
  emit('open-all')
}

function foldAll() {
  foldAllRows()
  emit('fold-all')
}

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

const { dragOverId, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } = useRowDrag((fromId, toId) => emit('row-move', fromId, toId))

const { isLoading: isSorting, showLoading: showSortLoading, hideLoading: hideSortLoading } = useLoading()

const { onResizeStart } = useColumnResize(
  (key) => columnState.find((c) => c.key === key)?.width ?? 120,
  (key, width) => {
    const col = columnState.find((c) => c.key === key)
    if (col) col.width = width
  },
  (column) => emit('column-resize', column),
)

const totalColumnCount = computed(() => visibleColumns.value.length + (props.checkable ? 1 : 0) + (props.draggable && props.dragHandle ? 1 : 0))

const theadRef = ref<HTMLElement | null>(null)
const headerHeight = ref(0)

function measureHeaderHeight() {
  if (theadRef.value) headerHeight.value = theadRef.value.getBoundingClientRect().height
}

onMounted(() => nextTick(measureHeaderHeight))
watch(() => [props.scrollHeight, headerRows.value.length, visibleColumns.value.length], () => nextTick(measureHeaderHeight))

const scrollContainerStyle = computed(() =>
  props.scrollHeight ? { maxHeight: props.scrollHeight + headerHeight.value + 'px', overflow: 'auto' } : undefined,
)

function isSortable(column: GridColumn) {
  return props.sortable && column.sortable !== false
}

function isResizable(column: GridColumn) {
  return props.resizable && column.resizable !== false
}

function isEditableColumn(column: GridColumn) {
  return props.editable && column.editable === true
}

function onHeaderClick(column: GridColumn) {
  if (!isSortable(column)) return

  if (props.sortLoading) {
    // Show the overlay immediately, then let a paint happen before running the
    // (synchronous, potentially expensive) sort - not delaying the overlay itself.
    showSortLoading()
    const delay = props.sortLoading === true ? 500 : props.sortLoading
    requestAnimationFrame(() => {
      setTimeout(() => {
        toggleSort(column.key)
        nextTick(hideSortLoading)
      }, delay)
    })
  } else {
    toggleSort(column.key)
  }
}

function ariaSort(column: GridColumn): 'ascending' | 'descending' | 'none' | undefined {
  if (!isSortable(column)) return undefined
  if (sortState.key !== column.key) return 'none'
  return sortState.order === 'asc' ? 'ascending' : 'descending'
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
    checked: props.checkable && isChecked(flat.row.id),
    dragtarget: props.draggable && dragOverId.value === flat.row.id,
    open: props.expandable && isExpanded(flat.row.id),
  }
}

function getCsv() {
  return rowsToCsv(visibleColumns.value, sortedRows.value)
}

function exportCsv(filename = 'table.csv') {
  downloadCsv(filename, getCsv())
}

/**
 * Parses a CSV string (shaped like `getCsv()`'s output) and emits the parsed rows via
 * `import-csv` - this component owns no row data of its own to replace (`rows` is a prop),
 * so applying the result to your reactive row source is up to the listener.
 */
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
})
</script>

<template>
  <div class="jui-grid-vue-root" :class="`theme-${theme}`">
    <ColumnMenu v-if="columnMenu" :columns="columnState" @toggle="toggleColumn" />
    <div v-if="isSorting" class="loading-overlay" role="status" aria-live="polite">
      <slot name="loading">Loading…</slot>
    </div>
    <div class="scroll-container" :style="scrollContainerStyle">
    <table
      class="table"
      :class="[variant, { expand: expandable, 'has-scroll': scrollHeight, headline, nowrap }]"
      :style="width ? { width: width + 'px' } : undefined"
      role="grid"
    >
      <colgroup>
        <col v-if="checkable" style="width: 28px" />
        <col v-if="draggable && dragHandle" style="width: 28px" />
        <col v-for="column in visibleColumns" :key="column.key" :style="{ width: column.width ? column.width + 'px' : undefined }" />
      </colgroup>
      <thead ref="theadRef">
        <tr v-for="(headerRow, rowIndex) in headerRows" :key="rowIndex" role="row">
          <template v-if="rowIndex === 0">
            <th v-if="checkable" class="col-check" role="columnheader" :rowspan="headerRows.length"></th>
            <th v-if="draggable && dragHandle" class="col-drag" role="columnheader" :rowspan="headerRows.length"></th>
          </template>
          <th
            v-for="cell in headerRow"
            :key="cell.column.key"
            role="columnheader"
            :colspan="cell.colspan > 1 ? cell.colspan : undefined"
            :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
            :class="{ sortable: cell.isLeaf && isSortable(cell.column) }"
            :aria-sort="cell.isLeaf ? ariaSort(cell.column) : undefined"
            :tabindex="cell.isLeaf && isSortable(cell.column) ? 0 : undefined"
            @click="cell.isLeaf && onHeaderClick(cell.column)"
            @keydown.enter="cell.isLeaf && onHeaderClick(cell.column)"
          >
            <slot v-if="cell.isLeaf" :name="`header-${cell.column.key}`" :column="cell.column">{{ cell.column.label ?? cell.column.key }}</slot>
            <template v-else>{{ cell.column.label ?? cell.column.key }}</template>
            <span v-if="cell.isLeaf && sortState.key === cell.column.key" class="sort-indicator" aria-hidden="true">{{
              sortState.order === 'asc' ? '▲' : '▼'
            }}</span>
            <div
              v-if="cell.isLeaf && isResizable(cell.column) && cell.leafIndex! < visibleColumns.length - 1"
              class="resize"
              @mousedown="onResizeStart($event, cell.column, visibleColumns[cell.leafIndex! + 1])"
            ></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="flatRows.length === 0" role="row">
          <td class="none" role="gridcell" style="text-align: center;" :colspan="totalColumnCount">
            <slot name="empty">Data does not exist.</slot>
          </td>
        </tr>
        <template v-for="flat in flatRows" :key="flat.row.id">
          <tr
            role="row"
            :class="rowClasses(flat)"
            :draggable="draggable"
            :tabindex="selectable || checkable ? 0 : undefined"
            :aria-selected="selectable ? isSelected(flat.row.id) : undefined"
            @click="onRowClick(flat.row, $event)"
            @keydown="onRowKeydown($event, flat.row)"
            @dblclick="onRowDblClick(flat.row, $event)"
            @contextmenu.prevent="onRowContextMenu(flat.row, $event)"
            @dragstart="draggable && onDragStart(flat.row.id)"
            @dragover.prevent="draggable && onDragOver(flat.row.id)"
            @dragleave="draggable && onDragLeave(flat.row.id)"
            @drop="draggable && onDrop(flat.row.id)"
            @dragend="draggable && onDragEnd()"
          >
            <td v-if="checkable" class="col-check" role="gridcell" @click.stop>
              <input type="checkbox" :checked="isChecked(flat.row.id)" @change="onToggleCheck(flat.row.id)" />
            </td>
            <td v-if="draggable && dragHandle" class="col-drag" role="gridcell">::</td>
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
    </div>
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

/* .table.has-scroll thead th의 position:sticky는 table.less(전역)로 옮겼다 - Pattern-A로
   손으로 짠 <table>(예: table_4/table_12)도 컴포넌트 없이 같은 클래스만으로 재사용할 수 있게. */

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

tbody tr[tabindex]:focus-visible,
thead th[tabindex]:focus-visible,
.tree-toggle:focus-visible {
  outline: 2px solid #8945ee;
  outline-offset: -2px;
}

.col-check,
.col-drag {
  width: 28px;
  text-align: center;
}

.col-drag {
  cursor: grab;
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
</style>
