<script setup lang="ts">
// Reproduces jui-grid/examples/xtable_paging.html: sort, resize, an initial
// column-visibility subset (colshow), the column menu, and page-based
// rendering (buffer:"page", bufferCount:10 -> pageSize 10) instead of
// continuous virtual scroll.
import { reactive } from 'vue'
import VirtualGrid from '../components/VirtualGrid.vue'
import type { GridColumn, GridRow } from '../types'
import ExampleLog from './ExampleLog.vue'
import { useExampleLog } from './useExampleLog'

const columns: GridColumn[] = [
  { key: 'min', label: 'Min' },
  { key: 'max', label: 'Max', visible: false },
  { key: 'count', label: 'Count' },
  { key: 'hash', label: 'Hash', visible: false },
  { key: 'failure', label: 'Failure' },
  { key: 'sumTime', label: 'SumTime', visible: false },
  { key: 'avgTime', label: 'AvgTime' },
  { key: 'name', label: 'Name' },
]

const templates = [
  { min: 21.55, max: 21.55, count: 1, hash: 1495461794, failure: 1, sumTime: 21.55, avgTime: 21.55, name: '/db2sql.jsp' },
  { min: 0.004, max: 1.683, count: 32, hash: -1976684343, failure: 27, sumTime: 4.529, avgTime: 0.142, name: '/dup.jsp' },
  { min: 0.062, max: 0.273, count: 8, hash: 1886515434, failure: 0, sumTime: 1.261, avgTime: 0.158, name: '/oraclesql2.jsp' },
  { min: 0.03, max: 0.12, count: 6, hash: 1888362476, failure: 0, sumTime: 0.343, avgTime: 0.057, name: '/oraclesql4.jsp' },
  { min: 0.001, max: 0.035, count: 11, hash: -758408983, failure: 11, sumTime: 0.052, avgTime: 0.005, name: '/ignoresqlexp.jsp' },
]

const rows = reactive<GridRow[]>(
  Array.from({ length: 42 }, (_, i) => ({ id: i, data: { ...templates[i % templates.length] } })),
)

const { log, addLog } = useExampleLog()
</script>

<template>
  <div>
    <h2>xtable_paging.html</h2>
    <p class="desc">Original options: <code>sort, resize, colshow:[min,count,failure,avgTime,name], buffer:"page", bufferCount:10</code>.</p>

    <VirtualGrid
      :columns="columns"
      :rows="rows"
      mode="paging"
      :page-size="10"
      sortable
      resizable
      selectable
      column-menu
      @sort="(c) => addLog(`sort: ${JSON.stringify(c)}`)"
      @page-change="(p) => addLog(`page-change: ${p}`)"
    />

    <ExampleLog :log="log" />
  </div>
</template>

<style scoped>
.desc {
  font-size: 12px;
  color: #666;
}
</style>
