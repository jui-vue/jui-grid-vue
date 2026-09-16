<script setup lang="ts">
// Reproduces jui-grid/examples/xtable_expand.html: dark theme, sort, resize, expand -
// a small non-virtualized grid (the original used xtableUI here but without buffer/
// paging options, so DataGrid is the equivalent surface).
import { reactive } from 'vue'
import DataGrid from '../components/DataGrid.vue'
import type { GridColumn, GridRow } from '../types'
import ExampleLog from './ExampleLog.vue'
import { useExampleLog } from './useExampleLog'

const columns: GridColumn[] = [
  { key: 'min', label: 'Min' },
  { key: 'max', label: 'Max' },
  { key: 'count', label: 'Count' },
  { key: 'hash', label: 'Hash' },
  { key: 'failure', label: 'Failure' },
  { key: 'sumTime', label: 'SumTime' },
  { key: 'avgTime', label: 'AvgTime' },
  { key: 'name', label: 'Name' },
]

const rows = reactive<GridRow[]>([
  { id: 1, data: { min: 21.55, max: 21.55, count: 1, hash: 1495461794, failure: 1, sumTime: 21.55, avgTime: 21.55, name: '' } },
  { id: 2, data: { min: 0.004, max: 1.683, count: 32, hash: -1976684343, failure: 27, sumTime: 4.529, avgTime: 0.142, name: '/dup.jsp' } },
  { id: 3, data: { min: 0.062, max: 0.273, count: 8, hash: 1886515434, failure: 0, sumTime: 1.261, avgTime: 0.158, name: '/oraclesql2.jsp' } },
  { id: 4, data: { min: 0.03, max: 0.12, count: 6, hash: 1888362476, failure: 0, sumTime: 0.343, avgTime: 0.057, name: '/oraclesql4.jsp' } },
  { id: 5, data: { min: 0.001, max: 0.035, count: 11, hash: -758408983, failure: 11, sumTime: 0.052, avgTime: 0.005, name: '/ignoresqlexp.jsp' } },
  { id: 6, data: { min: 0.014, max: 0.014, count: 1, hash: 1887438955, failure: 1, sumTime: 0.014, avgTime: 0.014, name: '/oraclesql3.jsp' } },
])

const { log, addLog } = useExampleLog()
</script>

<template>
  <div>
    <h2>xtable_expand.html</h2>
    <p class="desc">Original options: <code>sort, resize, expand</code>, dark theme.</p>

    <DataGrid
      :columns="columns"
      :rows="rows"
      theme="dark"
      sortable
      resizable
      expandable
      @expand="(r) => addLog(`expand: ${r.id}`)"
      @collapse="(r) => addLog(`collapse: ${r.id}`)"
    >
      <template #expand="{ row }">
        <pre style="margin: 0">{{ JSON.stringify(row.data, null, 2) }}</pre>
      </template>
    </DataGrid>

    <ExampleLog :log="log" />
  </div>
</template>

<style scoped>
.desc {
  font-size: 12px;
  color: #666;
}
</style>
