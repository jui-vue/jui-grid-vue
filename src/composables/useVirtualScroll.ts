import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'

export interface VirtualRange {
  startIndex: number
  endIndex: number
  topSpacerHeight: number
  bottomSpacerHeight: number
}

/** Pure windowing math, kept separate from DOM/ResizeObserver wiring so it's trivially unit-testable. */
export function computeVirtualRange(scrollTop: number, viewportHeight: number, itemHeight: number, rowCount: number, overscan: number): VirtualRange {
  if (rowCount === 0 || itemHeight <= 0) {
    return { startIndex: 0, endIndex: 0, topSpacerHeight: 0, bottomSpacerHeight: 0 }
  }

  const rawStart = Math.floor(scrollTop / itemHeight) - overscan
  const startIndex = Math.min(Math.max(0, rawStart), Math.max(0, rowCount - 1))

  const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2
  const endIndex = Math.min(rowCount, startIndex + visibleCount)

  return {
    startIndex,
    endIndex,
    topSpacerHeight: startIndex * itemHeight,
    bottomSpacerHeight: Math.max(0, (rowCount - endIndex) * itemHeight),
  }
}

export function useVirtualScroll(rowCount: Ref<number>, itemHeight: Ref<number> | number, overscan = 6) {
  const height = computed(() => (typeof itemHeight === 'number' ? itemHeight : itemHeight.value))
  const scrollTop = ref(0)
  const viewportHeight = ref(0)
  const containerRef = ref<HTMLElement | null>(null)

  let resizeObserver: ResizeObserver | null = null

  function onScroll(e: Event) {
    scrollTop.value = (e.target as HTMLElement).scrollTop
  }

  watch(containerRef, (el, _prev, onCleanup) => {
    resizeObserver?.disconnect()
    if (!el) return

    viewportHeight.value = el.clientHeight
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        viewportHeight.value = el.clientHeight
      })
      resizeObserver.observe(el)
    }

    onCleanup(() => resizeObserver?.disconnect())
  })

  const range = computed(() => computeVirtualRange(scrollTop.value, viewportHeight.value, height.value, rowCount.value, overscan))

  const totalHeight = computed(() => rowCount.value * height.value)

  function scrollToIndex(index: number) {
    if (containerRef.value) containerRef.value.scrollTop = Math.max(0, index) * height.value
  }

  onBeforeUnmount(() => resizeObserver?.disconnect())

  return { containerRef, onScroll, range, totalHeight, scrollToIndex }
}
