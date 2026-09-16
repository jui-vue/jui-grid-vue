# jui-grid-vue

A from-scratch Vue 3 rewrite of [jui-grid](https://github.com/juijs/jui-grid)'s `table.js` and `xtable.js`, using Composition API composables and native reactivity instead of jQuery/DOM manipulation. See [`../jui-grid`](../jui-grid) for the original library this ports.

Two components are exported:

- **`DataGrid`** — a fully-rendered table: sort, resize, select/check, inline edit, row drag-reorder, tree rows, CSV export, dark theme, column show/hide menu.
- **`VirtualGrid`** — for large datasets: virtual-scroll or paged rendering, multi-column sort (shift-click), client-side filtering, a loading overlay. Everything `DataGrid` supports except row drag-reorder (the original `xtable.js` didn't support it either).

## Install (within this workspace)

```bash
npm install
npm run dev        # demo app at http://localhost:5173
npm run test       # vitest — composable unit tests
npm run build      # typecheck + build the demo app
npm run build:lib  # typecheck + build the publishable package into dist-lib/
```

The demo app (`src/App.vue` + `src/router.ts`) is a small vue-router shell with one page per
[jui-grid `examples/*.html`](../jui-grid/examples) scenario, under `src/pages/` — `/table`,
`/table-tree`, `/xtable` (500k-row virtual scroll), `/xtable-expand`, `/xtable-paging`,
`/xtable-tree` (500-level deep chain), `/xtable-vscroll` (100k rows + nested append), and
`/xtable-test` (documented as a simplification: the original's grouped/multi-row header isn't
something this library supports).

## Usage

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { DataGrid } from 'jui-grid-vue'
import 'jui-grid-vue/style.css'
import 'jui-ui-vue/style.css' // the column show/hide menu is jui-ui-vue's Dropdown component
import type { GridColumn, GridRow } from 'jui-grid-vue'

const columns: GridColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'score', label: 'Score', sortable: true, editable: true },
]

const rows = reactive<GridRow[]>([
  { id: 1, data: { name: 'apple', score: 3 } },
  { id: 2, data: { name: 'banana', score: 7 } },
])
</script>

<template>
  <DataGrid :columns="columns" :rows="rows" sortable editable selectable />
</template>
```

`VirtualGrid` takes the same `columns`/`rows` shape, plus `mode` (`'virtual' | 'paging'`), `rowHeight`, `height`, and `pageSize`:

```vue
<VirtualGrid :columns="columns" :rows="hugeRowArray" mode="virtual" :row-height="28" :height="400" sortable />
```

### Row and column shape

```ts
interface GridColumn {
  key: string
  label?: string
  width?: number
  sortable?: boolean   // opt-out when the grid-level `sortable` prop is on
  resizable?: boolean  // opt-out when the grid-level `resizable` prop is on
  editable?: boolean   // opt-in: only true columns become editable
  align?: 'left' | 'center' | 'right'
  visible?: boolean    // initial show/hide state for the column menu, default true
}

interface GridRow<T = Record<string, any>> {
  id: string | number
  data: T
  children?: GridRow<T>[]  // renders as an indented, foldable tree row
}
```

### Slots

Both components accept per-column scoped slots (`#cell-<key>`, `#header-<key>`), plus `#expand` (the row's detail panel) and `#empty` (empty-state content).

### Imperative API

Both components expose methods via a template ref: `open(id)`, `fold(id)`, `toggle(id)` (tree rows), `openAll()`, `foldAll()`, `uncheckAll()`, `getCsv()`, `exportCsv(filename)`, `select(id)`, `hideExpand()`. `VirtualGrid` additionally exposes `setFilter(predicate)`, `clearFilter()`, `showLoading(delay?)`, `hideLoading()`, `scrollToIndex(i)`, `goToPage(n)`.

## Composables

Every behavior is implemented as an independent, unit-tested composable under `src/composables/` — `useSort`, `useMultiSort`, `useColumns`, `useColumnResize`, `useRowSelection`, `useExpandRow`, `useEditableRow`, `useRowDrag`, `useTreeRows`, `useCsv`, `usePaging`, `useFilter`, `useLoading`, `useVirtualScroll` — so you can build a custom grid layout on top of them without using `DataGrid`/`VirtualGrid` at all.

## Theming

Two built-in themes (`theme="classic"` / `theme="dark"`), ported from jui-grid's LESS variables and compiled once per theme so switching is a runtime class swap, no separate stylesheet load. Structural layout rules live in `src/styles/table.less`; colors live in `src/styles/table.theme.less` and `src/styles/theme/{classic,dark}.less`.

## What's intentionally different from the original jui-grid

- No jQuery, no dependency on the legacy `juijs`/`juijs-ui` runtime — everything is plain Vue reactivity.
- Props/emits/slots follow Vue conventions rather than mirroring the original's `options`-object + `event` map API.
- Row drag-reorder is HTML5 drag-and-drop instead of manual mousedown/mousemove/mouseup + cloned DOM element.

## Dependency on jui-ui-vue

The original `jui-grid`'s column show/hide menu (`table.js`'s `setColumnMenu`) depended on `juijs-ui`'s (jQuery-based) dropdown. This port depends on [`jui-ui-vue`](../jui-ui-vue/vue)'s native Vue 3 `Dropdown` component instead (see `src/components/ColumnMenu.vue`) — declared as a `file:../jui-ui-vue/vue` dependency in `package.json` since it isn't published. Both `jui-ui-vue` and `vue` are externalized in `build:lib` (not bundled into `dist-lib`), matching how a real npm dependency/peerDependency would be handled; consumers need `npm install` to resolve them and must import `jui-ui-vue/style.css` themselves (see Usage above).
