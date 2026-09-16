<script setup lang="ts">
// Reproduces jui-grid/examples/xtable_test.html *in spirit*: a very wide,
// horizontally-scrollable, empty grid used to stress-test header/scroll
// rendering. The original's two-row grouped header (colspan/rowspan across
// ~200 columns) is NOT something DataGrid/VirtualGrid support - grouped
// multi-row headers are a distinct feature this port doesn't implement, so
// this page approximates the same "very many flat columns, no data, wide
// horizontal scroll" stress case instead of the exact header grouping.
import VirtualGrid from '../components/VirtualGrid.vue'
import type { GridColumn } from '../types'

const columns: GridColumn[] = Array.from({ length: 80 }, (_, i) => ({ key: `col${i}`, label: `Col ${i + 1}`, width: 90 }))
</script>

<template>
  <div>
    <h2>xtable_test.html</h2>
    <p class="desc note">
      Not a faithful port: the original tests a 2-row grouped header (colspan/rowspan) across ~200 columns, which this library doesn't
      support. Shown here instead: 80 flat columns / no rows, to still exercise wide horizontal-scroll rendering.
    </p>

    <VirtualGrid :columns="columns" :rows="[]" mode="virtual" :height="300" resizable />
  </div>
</template>

<style scoped>
.desc {
  font-size: 12px;
  color: #666;
}
.note {
  color: #a03; /* light theme legible warning tone */
  max-width: 640px;
}
</style>
