<script setup lang="ts">
// Reproduces jui-grid/examples/xtable.html: 500,000 rows rendered through virtual
// scrolling, multi-column sort (msort), an initial column-visibility subset
// (colshow), resize, expand and the column show/hide menu.
//
// The row array is a shallowRef (not reactive/ref-deep) - at this volume, deeply
// proxying every row's `data` object would be wasted work we don't need: cell
// values are read fresh at render time regardless, and edits already trigger a
// re-render through other reactive state (see DataGrid/VirtualGrid's editingId).
import { shallowRef } from 'vue'
import VirtualGrid from '../components/VirtualGrid.vue'
import type { GridColumn, GridRow } from '../types'
import ExampleLog from './ExampleLog.vue'
import { useExampleLog } from './useExampleLog'

const columns: GridColumn[] = [
  { key: 'min', label: 'Min' },
  { key: 'max', label: 'Max' },
  { key: 'count', label: 'Count' },
  { key: 'hash', label: 'Hash', visible: false },
  { key: 'failure', label: 'Failure' },
  { key: 'sumTime', label: 'SumTime', visible: false },
  { key: 'avgTime', label: 'AvgTime' },
  { key: 'name', label: 'Name' },
]

function buildRows(): GridRow[] {
  const base = { min: 0.014, max: 0.014, count: 1, hash: 1887438955, failure: 1, sumTime: 0.014, avgTime: 0.014, name: '/oraclesql3.jsp' }
  const rows: GridRow[] = []

  for (let i = 0; i < 500_000; i++) {
    rows.push({ id: i, data: { ...base, min: i } })
  }

  return rows
}

const rows = shallowRef<GridRow[]>(buildRows())
const { log, addLog } = useExampleLog()
</script>

<template>
  <div>
    <h2>xtable.html</h2>
    <p class="desc">Original options: <code>msort, resize, expand, colshow:[min,max,count,failure,avgTime,name], buffer:"scroll"</code> over 500,000 rows.</p>

    <VirtualGrid
      :columns="columns"
      :rows="rows"
      mode="virtual"
      :row-height="26"
      :height="400"
      sortable
      resizable
      expandable
      column-menu
      @sort="(c) => addLog(`msort: ${JSON.stringify(c)}`)"
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
