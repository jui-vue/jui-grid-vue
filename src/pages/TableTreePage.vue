<script setup lang="ts">
// Reproduces jui-grid/examples/table_tree.html: dark theme, sort/resize/scroll,
// an editable column subset, expand, moveRow, and two child rows inserted under
// row 2 (originally done via `table_obj.insert("1.0", ...)` / `insert("1.1", ...)`
// - here expressed directly as a `children` array, our tree data model).
import { reactive, ref } from 'vue'
import DataGrid from '../components/DataGrid.vue'
import type { GridColumn, GridRow } from '../types'
import ExampleLog from './ExampleLog.vue'
import { useExampleLog } from './useExampleLog'

const columns: GridColumn[] = [
  { key: 'min', label: 'Min' },
  { key: 'max', label: 'Max' },
  { key: 'count', label: 'Count', editable: true },
  { key: 'hash', label: 'Hash', editable: true },
  { key: 'failure', label: 'Failure', editable: true },
  { key: 'sumTime', label: 'SumTime' },
  { key: 'avgTime', label: 'AvgTime' },
  { key: 'name', label: 'Name' },
]

const childData = { min: 0, max: 21.55, count: 1, hash: 1495461794, failure: 1, sumTime: 21.55, avgTime: 21.55, name: '' }

const rows = reactive<GridRow[]>([
  { id: 1, data: { min: 0, max: 21.55, count: 1, hash: 1495461794, failure: 1, sumTime: 21.55, avgTime: 21.55, name: '' } },
  {
    id: 2,
    data: { min: 1, max: 1.683, count: 32, hash: -1976684343, failure: 27, sumTime: 4.529, avgTime: 0.142, name: '/dup.jsp' },
    children: [
      { id: '2-1', data: { ...childData } },
      { id: '2-2', data: { ...childData } },
    ],
  },
  { id: 3, data: { min: 2, max: 0.273, count: 8, hash: 1886515434, failure: 0, sumTime: 1.261, avgTime: 0.158, name: '/oraclesql2.jsp' } },
  { id: 4, data: { min: 3, max: 0.014, count: 1, hash: 1887438955, failure: 1, sumTime: 0.014, avgTime: 0.014, name: '/oraclesql3.jsp' } },
])

const grid = ref<InstanceType<typeof DataGrid>>()
const { log, addLog } = useExampleLog()
</script>

<template>
  <div>
    <h2>table_tree.html</h2>
    <p class="desc">Original options: <code>sort, resize, scroll+scrollHeight:200, editRow subset, expand, moveRow</code>, dark theme, tree rows.</p>

    <DataGrid
      ref="grid"
      :columns="columns"
      :rows="rows"
      theme="dark"
      sortable
      resizable
      selectable
      editable
      expandable
      draggable
      :scroll-height="200"
      @sort="(s) => addLog(`sort: ${s.key} ${s.order}`)"
      @row-edit="(r, d) => addLog(`row-edit: ${r.id} -> ${JSON.stringify(d)}`)"
      @expand="(r) => addLog(`expand: ${r.id}`)"
    >
      <template #expand="{ row }">
        <pre style="margin: 0">{{ JSON.stringify(row.data, null, 2) }}</pre>
      </template>
    </DataGrid>

    <div class="toolbar">
      <button @click="grid?.openAll()">Open all</button>
      <button @click="grid?.foldAll()">Fold all</button>
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
