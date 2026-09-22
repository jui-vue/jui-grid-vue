<script setup lang="ts">
// Reproduces jui-grid/examples/table.html: sort, resize, scroll, editRow subset,
// expand, moveRow. checkable + column-menu are added on top to also exercise
// those DataGrid features on the same dataset (not in the original example).
import { reactive, ref } from 'vue'
import DataGrid from '../components/DataGrid.vue'
import type { GridColumn, GridRow } from '../types'
import ExampleLog from './ExampleLog.vue'
import { useExampleLog } from './useExampleLog'

const columns: GridColumn[] = [
  { key: 'min', label: 'Min' },
  { key: 'max', label: 'Max', editable: true },
  { key: 'count', label: 'Count', editable: true },
  { key: 'hash', label: 'Hash', editable: true },
  { key: 'failure', label: 'Failure' },
  { key: 'sumTime', label: 'SumTime' },
  { key: 'avgTime', label: 'AvgTime' },
  { key: 'name', label: 'Name' },
]

const rows = reactive<GridRow[]>([
  { id: 1, data: { min: 0, max: 21.55, count: 1, hash: 1495461794, failure: 1, sumTime: 21.55, avgTime: 21.55, name: '' } },
  { id: 2, data: { min: 1, max: 1.683, count: 32, hash: -1976684343, failure: 27, sumTime: 4.529, avgTime: 0.142, name: '/dup.jsp' } },
  { id: 3, data: { min: 2, max: 0.273, count: 8, hash: 1886515434, failure: 0, sumTime: 1.261, avgTime: 0.158, name: '/oraclesql2.jsp' } },
  { id: 4, data: { min: 3, max: 0.014, count: 1, hash: 1887438955, failure: 1, sumTime: 0.014, avgTime: 0.014, name: '/oraclesql3.jsp' } },
])

const grid = ref<InstanceType<typeof DataGrid>>()
const { log, addLog } = useExampleLog()

function onRowEdit(row: GridRow, data: Record<string, any>) {
  addLog(`row-edit: ${row.id} -> ${JSON.stringify(data)}`)
  // Original's `editend` handler rejects a non-numeric "max" (here: warn after the fact,
  // since our commit already applied the value - see README's Vue-conventions note).
  if ('max' in data && isNaN(Number(data.max))) {
    alert('숫자만 입력할 수 있습니다.')
  }
}

function onRowMove(fromId: GridRow['id'], beforeId: GridRow['id'] | undefined) {
  const fromIndex = rows.findIndex((r) => r.id === fromId)
  if (fromIndex === -1) return

  const [moved] = rows.splice(fromIndex, 1)
  const toIndex = beforeId == null ? -1 : rows.findIndex((r) => r.id === beforeId)
  if (toIndex === -1) rows.push(moved)
  else rows.splice(toIndex, 0, moved)
  addLog(`row-move: ${fromId} -> before ${beforeId ?? '(end)'}`)
}
</script>

<template>
  <div>
    <h2>table.html</h2>
    <p class="desc">Original options: <code>sort, resize, scroll+scrollHeight:200, editRow:[max,count,hash], expand, moveRow</code>.</p>

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
      :scroll-height="200"
      @sort="(s) => addLog(`sort: ${s.key} ${s.order}`)"
      @row-click="(r) => addLog(`row-click: ${r.id}`)"
      @row-edit="onRowEdit"
      @row-move="onRowMove"
      @expand="(r) => addLog(`expand: ${r.id}`)"
      @collapse="(r) => addLog(`collapse: ${r.id}`)"
    >
      <template #expand="{ row }">
        <pre style="margin: 0">{{ JSON.stringify(row.data, null, 2) }}</pre>
      </template>
    </DataGrid>

    <div class="toolbar">
      <button @click="grid?.exportCsv('table')">Download CSV</button>
      <button @click="grid?.uncheckAll()">Uncheck all</button>
    </div>

    <ExampleLog :log="log" />
  </div>
</template>

<style scoped>
.desc {
  font-size: 12px;
  color: #666;
}
.toolbar {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
</style>
