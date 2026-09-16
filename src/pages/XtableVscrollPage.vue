<script setup lang="ts">
// Reproduces jui-grid/examples/xtable_vscroll.html: "Run" builds 100,000 flat rows
// via virtual scroll, then appends 3 children under row index 3 and 2 grandchildren
// under its first child (originally `xtable.append("3", ...)` / `append("3.1", ...)`
// - here done by pushing directly into the row's `children` array). An initial
// column-visibility subset (colshow) and click-to-toggle tree rows round it out.
import { ref, shallowRef } from 'vue'
import VirtualGrid from '../components/VirtualGrid.vue'
import type { GridColumn, GridRow } from '../types'
import ExampleLog from './ExampleLog.vue'
import { useExampleLog } from './useExampleLog'

const columns: GridColumn[] = [
  { key: 'min', label: 'Min' },
  { key: 'max', label: 'Max' },
  { key: 'count', label: 'Count', visible: false },
  { key: 'hash', label: 'Hash' },
  { key: 'failure', label: 'Failure', visible: false },
  { key: 'sumTime', label: 'SumTime', visible: false },
  { key: 'avgTime', label: 'AvgTime' },
  { key: 'name', label: 'Name', visible: false },
]

function randomRow(i: number): GridRow {
  return { id: i, data: { min: i, max: 21.55, count: 1, hash: 1495461794, failure: 1, sumTime: 21.55, avgTime: 21.55, name: '/db2sql.jsp' } }
}

const rows = shallowRef<GridRow[]>([])
const grid = ref<InstanceType<typeof VirtualGrid>>()
const { log, addLog } = useExampleLog()

function onRun() {
  const flat = Array.from({ length: 100_000 }, (_, i) => randomRow(i))
  const parent = flat[3]
  parent.children = [randomRow(9001), randomRow(9002), randomRow(9003)]
  parent.children[0].children = [randomRow(9011), randomRow(9012)]

  rows.value = flat
  addLog('built 100,000 rows + appended children under row 3 and 3.1')
}

function onRowClick(row: GridRow) {
  if (row.children && row.children.length > 0) grid.value?.toggle(row.id)
}
</script>

<template>
  <div>
    <h2>xtable_vscroll.html</h2>
    <p class="desc">Original options: <code>sort, resize, scrollHeight:400, rowHeight:26, colshow:[min,max,hash,avgTime]</code> over 100,000 rows.</p>

    <div class="toolbar">
      <button @click="onRun">Run</button>
    </div>

    <VirtualGrid
      ref="grid"
      :columns="columns"
      :rows="rows"
      mode="virtual"
      :row-height="26"
      :height="400"
      sortable
      resizable
      column-menu
      @row-click="onRowClick"
      @sort="(c) => addLog(`sort: ${JSON.stringify(c)}`)"
    />

    <ExampleLog :log="log" />
  </div>
</template>

<style scoped>
.desc {
  font-size: 12px;
  color: #666;
}
.toolbar {
  margin-bottom: 8px;
}
</style>
