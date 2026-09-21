// jui-ui-vue's stylesheet is NOT bundled here (jui-ui-vue is externalized in the lib build,
// same as vue) - consumers import it themselves alongside this package's own stylesheet.
import './styles/index.less'

import type { App } from 'vue'
import DataGrid from './components/DataGrid.vue'
import VirtualGrid from './components/VirtualGrid.vue'
import ColumnMenu from './components/ColumnMenu.vue'

export { DataGrid, VirtualGrid, ColumnMenu }
export * from './types'
export * from './composables/useSort'
export * from './composables/useMultiSort'
export * from './composables/useColumns'
export * from './composables/useColumnResize'
export * from './composables/useRowSelection'
export * from './composables/useExpandRow'
export * from './composables/useEditableRow'
export * from './composables/useRowDrag'
export * from './composables/useTreeRows'
export * from './composables/useCsv'
export * from './composables/usePaging'
export * from './composables/useFilter'
export * from './composables/useLoading'
export * from './composables/useVirtualScroll'

const components = { DataGrid, VirtualGrid, ColumnMenu }

const install = (app: App) => {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}

export default { install }
