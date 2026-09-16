import { createRouter, createWebHistory } from 'vue-router'

export interface ExampleRoute {
  path: string
  name: string
  label: string
  source: string
  component: () => Promise<unknown>
}

export const exampleRoutes: ExampleRoute[] = [
  { path: '/table', name: 'table', label: 'Basic table', source: 'table.html', component: () => import('./pages/TablePage.vue') },
  { path: '/table-tree', name: 'table-tree', label: 'Table + tree rows', source: 'table_tree.html', component: () => import('./pages/TableTreePage.vue') },
  { path: '/xtable', name: 'xtable', label: 'Virtual scroll (500k rows)', source: 'xtable.html', component: () => import('./pages/XtablePage.vue') },
  { path: '/xtable-expand', name: 'xtable-expand', label: 'Expand row', source: 'xtable_expand.html', component: () => import('./pages/XtableExpandPage.vue') },
  { path: '/xtable-paging', name: 'xtable-paging', label: 'Paging', source: 'xtable_paging.html', component: () => import('./pages/XtablePagingPage.vue') },
  { path: '/xtable-tree', name: 'xtable-tree', label: 'Deep tree (500 levels)', source: 'xtable_tree.html', component: () => import('./pages/XtableTreePage.vue') },
  { path: '/xtable-vscroll', name: 'xtable-vscroll', label: 'Virtual scroll + tree', source: 'xtable_vscroll.html', component: () => import('./pages/XtableVscrollPage.vue') },
  { path: '/xtable-test', name: 'xtable-test', label: 'Wide header stress test', source: 'xtable_test.html', component: () => import('./pages/XtableTestPage.vue') },
  { path: '/api-audit', name: 'api-audit', label: 'API audit', source: 'api.jui.io/v2', component: () => import('./pages/ApiAuditPage.vue') },
]

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/table' },
    ...exampleRoutes.map((r) => ({ path: r.path, name: r.name, component: r.component })),
  ],
})
