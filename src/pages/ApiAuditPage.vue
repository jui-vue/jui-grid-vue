<script setup lang="ts">
// Exercises every method/event added while closing the gap against the original
// jui-grid API (http://api.jui.io/v2/#!/api/grid.table, grid.xtable): unselect,
// check/uncheck/listChecked, showColumn/hideColumn/initColumns, showExpand/getExpand,
// showEditRow/hideEditRow/getEditRow, activeIndex, getPage, setCsv/setCsvFile,
// initialSort, sortLoading, width, and the col-show/col-hide/open-all/fold-all/
// edit-start events.
import { reactive, ref } from 'vue'
import DataGrid from '../components/DataGrid.vue'
import VirtualGrid from '../components/VirtualGrid.vue'
import type { GridColumn, GridRow } from '../types'
import ExampleLog from './ExampleLog.vue'
import { useExampleLog } from './useExampleLog'

const columns: GridColumn[] = [
  { key: 'name', label: 'Name', editable: true },
  { key: 'score', label: 'Score', editable: true },
  { key: 'note', label: 'Note' },
]

const rows = reactive<GridRow[]>([
  { id: 1, data: { name: 'apple', score: 3, note: 'a' } },
  { id: 2, data: { name: 'banana', score: 7, note: 'b' } },
  { id: 3, data: { name: 'cherry', score: 1, note: 'c' } },
])

const grid = ref<InstanceType<typeof DataGrid>>()
const { log, addLog } = useExampleLog(10)

function onImportCsv(imported: Record<string, string>[]) {
  rows.splice(0, rows.length, ...imported.map((data, i) => ({ id: 100 + i, data })))
  addLog(`import-csv: replaced with ${imported.length} rows`)
}

function onSetCsv() {
  grid.value?.setCsv('Name,Score,Note\nimported1,10,x\nimported2,20,y')
}

const vgrid = ref<InstanceType<typeof VirtualGrid>>()
const bigRows = reactive<GridRow[]>(Array.from({ length: 2000 }, (_, i) => ({ id: i, data: { name: `Row ${i}`, score: i, note: '' } })))
</script>

<template>
  <div>
    <h2>API audit</h2>
    <p class="desc">DataGrid: unselect/check/uncheck/listChecked, showColumn/hideColumn/initColumns, showExpand/getExpand, showEditRow/hideEditRow/getEditRow, activeIndex, CSV import, initial sort, sortLoading, width.</p>

    <DataGrid
      ref="grid"
      :columns="columns"
      :rows="rows"
      :width="500"
      sortable
      resizable
      selectable
      checkable
      editable
      expandable
      column-menu
      :initial-sort="{ key: 'score', order: 'desc' }"
      :sort-loading="200"
      @col-show="(c) => addLog(`col-show: ${c.key}`)"
      @col-hide="(c) => addLog(`col-hide: ${c.key}`)"
      @open-all="addLog('open-all')"
      @fold-all="addLog('fold-all')"
      @edit-start="(r) => addLog(`edit-start: ${r.id}`)"
      @row-edit="(r, d) => addLog(`row-edit: ${r.id} -> ${JSON.stringify(d)}`)"
      @import-csv="onImportCsv"
    >
      <template #expand="{ row }">
        <pre style="margin: 0">{{ JSON.stringify(row.data, null, 2) }}</pre>
      </template>
    </DataGrid>

    <div class="toolbar">
      <button @click="grid?.select(2)">select(2)</button>
      <button @click="grid?.unselect()">unselect()</button>
      <button @click="grid?.check(1)">check(1)</button>
      <button @click="grid?.check(2)">check(2)</button>
      <button @click="grid?.uncheck(1)">uncheck(1)</button>
      <button @click="addLog(`listChecked: ${JSON.stringify(grid?.listChecked())}`)">listChecked()</button>
      <button @click="grid?.hideColumn('note')">hideColumn(note)</button>
      <button @click="grid?.showColumn('note')">showColumn(note)</button>
      <button @click="grid?.initColumns(['name'])">initColumns([name])</button>
      <button @click="grid?.showExpand(1)">showExpand(1)</button>
      <button @click="addLog(`getExpand: ${grid?.getExpand()?.id ?? 'null'}`)">getExpand()</button>
      <button @click="grid?.hideExpand()">hideExpand()</button>
      <button @click="grid?.showEditRow(1)">showEditRow(1)</button>
      <button @click="addLog(`getEditRow: ${grid?.getEditRow()?.id ?? 'null'}`)">getEditRow()</button>
      <button @click="grid?.hideEditRow()">hideEditRow()</button>
      <button @click="addLog(`activeIndex: ${grid?.activeIndex()}`)">activeIndex()</button>
      <button @click="onSetCsv">setCsv(...)</button>
    </div>

    <h3 style="margin-top: 24px">VirtualGrid: getPage, multi-sort initialSort, sortLoading</h3>
    <VirtualGrid ref="vgrid" :columns="columns" :rows="bigRows" mode="paging" :page-size="20" :initial-sort="[{ key: 'score', order: 'desc' }]" :sort-loading="true" sortable selectable />
    <div class="toolbar">
      <button @click="addLog(`getPage: ${vgrid?.getPage()}`)">getPage()</button>
      <button @click="vgrid?.goToPage(3)">goToPage(3)</button>
    </div>

    <ExampleLog :log="log" />
  </div>
</template>

<style scoped>
.desc {
  font-size: 12px;
  color: #666;
  max-width: 640px;
}
.toolbar {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
