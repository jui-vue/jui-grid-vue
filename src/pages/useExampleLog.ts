import { ref } from 'vue'

/** Small shared "event log" panel used by every example page to show fired events. */
export function useExampleLog(limit = 8) {
  const log = ref<string[]>([])

  function addLog(msg: string) {
    log.value.unshift(msg)
    log.value = log.value.slice(0, limit)
  }

  return { log, addLog }
}
