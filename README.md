# jui-grid-vue

A from-scratch Vue 3 rewrite of [jui-grid](https://github.com/juijs/jui-grid)'s `table.js` and `xtable.js`, using Composition API composables and native reactivity instead of jQuery/DOM manipulation. See [jui-grid](https://github.com/juijs/jui-grid) for the original library this ports.

Two components are exported:

- **`DataGrid`** — a fully-rendered table: sort, resize, select/check, inline edit, row drag-reorder, tree rows, CSV export, dark theme, column show/hide menu.
- **`VirtualGrid`** — for large datasets: virtual-scroll or paged rendering, multi-column sort (shift-click), client-side filtering, a loading overlay. Everything `DataGrid` supports except row drag-reorder (the original `xtable.js` didn't support it either).

## Development

```bash
npm install
npm run dev        # demo app at http://localhost:5173
npm run test       # vitest — composable unit tests
npm run build      # typecheck + build the demo app
npm run build:lib  # typecheck + build the publishable package into dist-lib/
```

The demo app (`src/App.vue` + `src/router.ts`) is a small vue-router shell with one page per
[jui-grid `examples/*.html`](https://github.com/juijs/jui-grid/tree/master/examples) scenario, under `src/pages/` — `/table`,
`/table-tree`, `/xtable` (500k-row virtual scroll), `/xtable-expand`, `/xtable-paging`,
`/xtable-tree` (500-level deep chain), `/xtable-vscroll` (100k rows + nested append), and
`/xtable-test` (grouped/multi-row column headers), and `/api-audit` (every method/event
listed below, exercised against [api.jui.io/v2](http://api.jui.io/v2/#!/api/grid.table)'s
`grid.table`/`grid.xtable` docs).

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

Both also take `width` (total table width in px), `initialSort` (`DataGrid`: `{ key, order? }`;
`VirtualGrid`: `SortCriterion[]` for its multi-sort), and `sortLoading` (`true`, or a number of
ms) to show a loading overlay while a sort runs - useful once a dataset is large enough that
sorting it visibly blocks the main thread:

```vue
<DataGrid :columns="columns" :rows="rows" sortable :initial-sort="{ key: 'score', order: 'desc' }" :sort-loading="true" />
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
  children?: GridColumn[]  // grouped header - see below
}

interface GridRow<T = Record<string, any>> {
  id: string | number
  data: T
  children?: GridRow<T>[]  // renders as an indented, foldable tree row
}
```

#### Grouped (multi-row) column headers

A column with `children` is a group header spanning them with `colspan` in its own header
row - it isn't itself bound to row data, and its `sortable`/`resizable`/`editable`/`width`/
`align`/`visible` are ignored (those apply to its leaf descendants). An ungrouped column next
to a group gets `rowspan` down to the bottom header row, matching the classic HTML
grouped-header layout:

```ts
const columns: GridColumn[] = [
  { key: 'name', label: 'Name' }, // spans both header rows
  {
    key: 'contact', // group header - needs a unique key, but it's otherwise unused
    label: 'Contact',
    children: [
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ],
  },
]
```

Sorting, resizing and the column menu all still operate on the flattened leaf columns
(`email`, `phone`, ...) exactly as without grouping - a group header's `colspan` automatically
shrinks (or the header cell disappears entirely) as its leaves are hidden via the column menu.

### Slots

Both components accept per-column scoped slots (`#cell-<key>`, `#header-<key>`), plus `#expand` (the row's detail panel) and `#empty` (empty-state content).

### Events

`sort`, `row-click`, `row-dblclick`, `row-contextmenu`, `update:selected`, `update:checked`,
`column-resize`, `update:columns`, `row-edit` (a cell's edit was committed), `edit-start` (a
cell just entered edit mode), `expand`, `collapse`, `col-show`, `col-hide` (a column's
visibility changed, from the column menu or `showColumn`/`hideColumn`/`initColumns`),
`open-all`, `fold-all` (fired by calling the matching method - see below), `import-csv` (see
CSV import below). `DataGrid` also has `row-move`; `VirtualGrid` also has `page-change`.

### Imperative API

Both components expose, via a template ref:

- **Rows**: `select(id)`, `unselect()`, `check(id)`, `uncheck(id)`, `uncheckAll()`, `listChecked()`, `activeIndex()` (id of whichever row is expanded, else selected, else being edited - `null` if none)
- **Tree**: `open(id)`, `fold(id)`, `toggle(id)`, `openAll()`, `foldAll()`
- **Columns**: `showColumn(key)`, `hideColumn(key)`, `initColumns(keys)` (show exactly these, hide the rest)
- **Expand panel**: `showExpand(id)`, `hideExpand()`, `getExpand()` (the currently expanded `GridRow`, or `null`)
- **Inline edit**: `showEditRow(id)`, `hideEditRow()`, `getEditRow()` (the currently-edited `GridRow`, or `null`)
- **CSV**: `getCsv()`, `exportCsv(filename)`, `setCsv(csv)`, `setCsvFile(file)` (parses and emits `import-csv` with the row data - neither component owns `rows` to replace it directly, since it's a prop; apply the result to your reactive row source in the listener)

`VirtualGrid` additionally exposes `setFilter(predicate)`, `clearFilter()`, `showLoading(delay?)`, `hideLoading()`, `scrollToIndex(i)`, `goToPage(n)`, `getPage()` (1-indexed, unlike the original's 0-indexed `getPage()`).

## Composables

Every behavior is implemented as an independent, unit-tested composable under `src/composables/` — `useSort`, `useMultiSort`, `useColumns`, `useColumnResize`, `useRowSelection`, `useExpandRow`, `useEditableRow`, `useRowDrag`, `useTreeRows`, `useCsv`, `usePaging`, `useFilter`, `useLoading`, `useVirtualScroll` — so you can build a custom grid layout on top of them without using `DataGrid`/`VirtualGrid` at all.

## Theming

Three built-in themes (`theme="classic"` / `theme="dark"` / `theme="jennifer"`), ported from jui-grid's LESS variables and compiled once per theme so switching is a runtime class swap, no separate stylesheet load. Structural layout rules live in `src/styles/table.less`; colors live in `src/styles/table.theme.less` and `src/styles/theme/{classic,dark,jennifer}.less`.

## What's intentionally different from the original jui-grid

- No jQuery, no dependency on the legacy `juijs`/`juijs-ui` runtime — everything is plain Vue reactivity.
- Props/emits/slots follow Vue conventions rather than mirroring the original's `options`-object + `event` map API.
- Row drag-reorder is HTML5 drag-and-drop instead of manual mousedown/mousemove/mouseup + cloned DOM element.
- `update`/`updateTree`/`append`/`insert`/`remove`/`reset`/`move`/`get*`/`list*`/`size`/`count` aren't exposed methods - `rows`/`columns` are props the consumer already owns and mutates directly (as shown throughout `src/pages/`), rather than the grid holding its own copy of the data.
- No `xssFilter` option: Vue's `{{ }}` text interpolation already HTML-escapes every cell value by default (the original needed it because it built rows via jQuery's `.html()`). A column that opts out via a `#cell-<key>` slot rendering raw HTML is the consumer's own responsibility, same as anywhere else in Vue.
- No `sortCache` option: `sortedRows`/`flatRows` are plain Vue `computed()`s, which already skip recomputation whenever their reactive inputs haven't changed - the caching the original's `sortCache` opted into is the default behavior here.

## Dependency on jui-ui-vue

The original `jui-grid`'s column show/hide menu (`table.js`'s `setColumnMenu`) depended on `juijs-ui`'s (jQuery-based) dropdown. This port depends on [`jui-ui-vue`](https://github.com/juijs-vue/jui-ui-vue/tree/master/vue)'s native Vue 3 `Dropdown` component instead (see `src/components/ColumnMenu.vue`) — declared as a `file:../jui-ui-vue/vue` dependency in `package.json` since it isn't published. Both `jui-ui-vue` and `vue` are externalized in `build:lib` (not bundled into `dist-lib`), matching how a real npm dependency/peerDependency would be handled; consumers need `npm install` to resolve them and must import `jui-ui-vue/style.css` themselves (see Usage above).
