<script setup lang="ts">
import { reactive, ref } from 'vue'
import DataGrid from './components/DataGrid.vue'
import VirtualGrid from './components/VirtualGrid.vue'
import type { GridColumn, GridRow } from './types'

const columns: GridColumn[] = [
  { key: 'min', label: 'Min', width: 90 },
  { key: 'max', label: 'Max', width: 90, editable: true },
  { key: 'count', label: 'Count', width: 90 },
  { key: 'hash', label: 'Hash', width: 140 },
  { key: 'failure', label: 'Failure', width: 90 },
  { key: 'sumTime', label: 'SumTime', width: 100 },
  { key: 'avgTime', label: 'AvgTime', width: 100 },
  { key: 'name', label: 'Name' },
]

const rows = reactive<GridRow[]>([
  { id: 1, data: { min: 0, max: 21.55, count: 1, hash: 1495461794, failure: 1, sumTime: 21.55, avgTime: 21.55, name: '' } },
  { id: 2, data: { min: 1, max: 1.683, count: 32, hash: -1976684343, failure: 27, sumTime: 4.529, avgTime: 0.142, name: '/dup.jsp' } },
  { id: 3, data: { min: 2, max: 0.273, count: 8, hash: 1886515434, failure: 0, sumTime: 1.261, avgTime: 0.158, name: '/oraclesql2.jsp' } },
  { id: 4, data: { min: 3, max: 0.014, count: 1, hash: 1887438955, failure: 1, sumTime: 0.014, avgTime: 0.014, name: '/oraclesql3.jsp' } },
])

const treeColumns: GridColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'value', label: 'Value' },
]

const treeRows = reactive<GridRow[]>([
  {
    id: 'a',
    data: { name: 'Group A', value: 10 },
    children: [
      { id: 'a-1', data: { name: 'Item A-1', value: 3 } },
      { id: 'a-2', data: { name: 'Item A-2', value: 7 } },
    ],
  },
  {
    id: 'b',
    data: { name: 'Group B', value: 5 },
    children: [{ id: 'b-1', data: { name: 'Item B-1', value: 5 } }],
  },
])

const bigColumns: GridColumn[] = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'name', label: 'Name', width: 160, editable: true },
  { key: 'score', label: 'Score', width: 100 },
]

const bigRows = reactive<GridRow[]>(
  Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    data: { id: i, name: `Row ${i}`, score: Math.round(Math.random() * 1000) },
  })),
)

const vgrid = ref<InstanceType<typeof VirtualGrid>>()

function onFilterEvens() {
  vgrid.value?.setFilter((row: GridRow) => row.data.id % 2 === 0)
}

function onClearFilter() {
  vgrid.value?.clearFilter()
}

function onSimulateLoad() {
  vgrid.value?.showLoading()
  setTimeout(() => vgrid.value?.hideLoading(), 1000)
}

const grid = ref<InstanceType<typeof DataGrid>>()
const log = ref<string[]>([])

function addLog(msg: string) {
  log.value.unshift(msg)
  log.value = log.value.slice(0, 6)
}

function onRowMove(fromId: GridRow['id'], toId: GridRow['id']) {
  const fromIndex = rows.findIndex((r) => r.id === fromId)
  const toIndex = rows.findIndex((r) => r.id === toId)
  if (fromIndex === -1 || toIndex === -1) return

  const [moved] = rows.splice(fromIndex, 1)
  rows.splice(toIndex, 0, moved)
  addLog(`row-move: ${fromId} -> ${toId}`)
}
</script>

<template>
  <div style="max-width: 960px; margin: 24px auto; font-family: sans-serif">
    <h2>jui-grid-vue demo</h2>

    <h3>Basic table.js parity: sort / resize / checkable / editable / expand / draggable</h3>
    <DataGrid
      ref="grid"
      :columns="columns"
      :rows="rows"
      sortable
      resizable
      selectable
      checkable
      editable
      expandable
      draggable
      column-menu
      :scroll-height="220"
      @sort="(s) => addLog(`sort: ${s.key} ${s.order}`)"
      @row-click="(r) => addLog(`row-click: ${r.id}`)"
      @row-edit="(r, d) => addLog(`row-edit: ${r.id} -> ${JSON.stringify(d)}`)"
      @row-move="onRowMove"
      @expand="(r) => addLog(`expand: ${r.id}`)"
      @collapse="(r) => addLog(`collapse: ${r.id}`)"
    >
      <template #expand="{ row }">
        <pre style="margin: 0">{{ JSON.stringify(row.data, null, 2) }}</pre>
      </template>
    </DataGrid>

    <div style="margin-top: 8px">
      <button @click="grid?.exportCsv('table')">Download CSV</button>
      <button @click="grid?.uncheckAll()">Uncheck all</button>
    </div>

    <h3 style="margin-top: 32px">Tree rows: open / fold</h3>
    <DataGrid :columns="treeColumns" :rows="treeRows" selectable />

    <h3 style="margin-top: 32px">Dark theme</h3>
    <DataGrid :columns="treeColumns" :rows="treeRows" theme="dark" selectable sortable />

    <h3 style="margin-top: 32px">xtable parity: virtual scroll over 5,000 rows (shift-click header for multi-sort)</h3>
    <VirtualGrid
      ref="vgrid"
      :columns="bigColumns"
      :rows="bigRows"
      mode="virtual"
      :row-height="28"
      :height="300"
      sortable
      resizable
      selectable
      checkable
      editable
      expandable
      column-menu
      @sort="(c) => addLog(`msort: ${JSON.stringify(c)}`)"
      @row-edit="(r, d) => addLog(`vgrid-edit: ${r.id} -> ${JSON.stringify(d)}`)"
    >
      <template #expand="{ row }">
        <pre style="margin: 0">{{ JSON.stringify(row.data, null, 2) }}</pre>
      </template>
    </VirtualGrid>
    <div style="margin-top: 8px">
      <button @click="onFilterEvens">Filter even IDs</button>
      <button @click="onClearFilter">Clear filter</button>
      <button @click="onSimulateLoad">Simulate loading</button>
    </div>

    <h3 style="margin-top: 32px">xtable parity: paging mode</h3>
    <VirtualGrid :columns="bigColumns" :rows="bigRows" mode="paging" :page-size="20" sortable selectable />

    <h3 style="margin-top: 32px">Event log</h3>
    <ul>
      <li v-for="(l, i) in log" :key="i">{{ l }}</li>
    </ul>
  </div>
</template>
