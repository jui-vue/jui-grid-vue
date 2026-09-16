import { computed, ref, watch, type Ref } from 'vue'

export function usePaging<T>(rows: Ref<T[]>, pageSize: Ref<number> | number = 50) {
  const currentPage = ref(1)
  const size = computed(() => (typeof pageSize === 'number' ? pageSize : pageSize.value))
  const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / size.value)))

  const pageRows = computed(() => {
    const start = (currentPage.value - 1) * size.value
    return rows.value.slice(start, start + size.value)
  })

  function goToPage(page: number) {
    currentPage.value = Math.min(Math.max(1, page), pageCount.value)
  }

  function next() {
    goToPage(currentPage.value + 1)
  }

  function prev() {
    goToPage(currentPage.value - 1)
  }

  watch(pageCount, (count) => {
    if (currentPage.value > count) currentPage.value = count
  })

  return { currentPage, pageCount, pageRows, goToPage, next, prev }
}
