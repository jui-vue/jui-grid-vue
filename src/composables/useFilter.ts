import { computed, shallowRef, type Ref } from 'vue'
import type { GridRow } from '../types'

export type FilterPredicate<T = Record<string, any>> = (row: GridRow<T>) => boolean

export function useFilter<T = Record<string, any>>(rows: Ref<GridRow<T>[]>) {
  const predicate = shallowRef<FilterPredicate<T> | null>(null)
  const hasFilter = computed(() => predicate.value !== null)

  const filteredRows = computed(() => (predicate.value ? rows.value.filter(predicate.value) : rows.value))

  function setFilter(fn: FilterPredicate<T> | null) {
    predicate.value = fn
  }

  function clearFilter() {
    predicate.value = null
  }

  return { filteredRows, setFilter, clearFilter, hasFilter }
}
