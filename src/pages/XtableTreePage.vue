<script setup lang="ts">
// Reproduces jui-grid/examples/xtable_tree.html: a single 500-level-deep chain of
// tree rows (each level has exactly one child), sort/resize, "Run" to build it and
// "Open" to expand every level, and clicking a row toggles its own fold state
// (the original's `select` event handler did this same open/fold-on-click).
import { ref, shallowRef } from 'vue'
import VirtualGrid from '../components/VirtualGrid.vue'
import type { GridColumn, GridRow } from '../types'
import ExampleLog from './ExampleLog.vue'
import { useExampleLog } from './useExampleLog'

const columns: GridColumn[] = [
  { key: 'name', label: 'Name', width: 300 },
  { key: 'age', label: 'Age', width: 100 },
]

function buildChain(depth: number): GridRow[] {
  let node: GridRow = { id: `n${depth - 1}`, data: { name: `Hong${depth - 1}`, age: Math.floor(Math.random() * 100) } }

  for (let i = depth - 2; i >= 0; i--) {
    node = { id: `n${i}`, data: { name: `Hong${i}`, age: Math.floor(Math.random() * 100) }, children: [node] }
  }

  return [node]
}

const rows = shallowRef<GridRow[]>([])
const grid = ref<InstanceType<typeof VirtualGrid>>()
const { log, addLog } = useExampleLog()

function onRun() {
  rows.value = buildChain(500)
  addLog('built a 500-level chain')
}

function onOpenAll() {
  grid.value?.openAll()
}

function onRowClick(row: GridRow) {
  grid.value?.toggle(row.id)
}
</script>

<template>
  <div>
    <h2>xtable_tree.html</h2>
    <p class="desc">Original options: <code>sort, resize, scrollHeight:400, rowHeight:26, buffer:"vscroll"</code>, click-to-toggle rows.</p>

    <div class="toolbar">
      <button @click="onRun">Run (build 500-level chain)</button>
      <button @click="onOpenAll">Open all</button>
    </div>

    <VirtualGrid ref="grid" :columns="columns" :rows="rows" mode="virtual" :row-height="26" :height="400" sortable resizable @row-click="onRowClick" />

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
  display: flex;
  gap: 8px;
}
</style>
