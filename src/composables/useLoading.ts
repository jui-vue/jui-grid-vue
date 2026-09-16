import { onBeforeUnmount, ref } from 'vue'

export function useLoading() {
  const isLoading = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function showLoading(delay = 0) {
    clearTimer()
    if (delay > 0) {
      timer = setTimeout(() => {
        isLoading.value = true
      }, delay)
    } else {
      isLoading.value = true
    }
  }

  function hideLoading() {
    clearTimer()
    isLoading.value = false
  }

  onBeforeUnmount(clearTimer)

  return { isLoading, showLoading, hideLoading }
}
