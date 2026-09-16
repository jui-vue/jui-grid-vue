<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { Dropdown } from 'jui-ui-vue'
import type { GridColumn } from '../types'

defineProps<{
  columns: Array<GridColumn & { visible: boolean }>
}>()

const emit = defineEmits<{
  toggle: [key: string]
}>()

const open = ref(false)
const toggleBtn = useTemplateRef<HTMLButtonElement>('toggleBtn')
const dropdown = useTemplateRef<InstanceType<typeof Dropdown>>('dropdown')

function onToggleClick() {
  if (open.value) {
    dropdown.value?.hide()
    return
  }

  const btn = toggleBtn.value
  if (!btn) return
  dropdown.value?.show(btn.offsetLeft, btn.offsetTop + btn.offsetHeight + 4)
}

// jui-ui-vue's Dropdown closes on an outside click by itself (process-wide listener shared by
// every open dropdown) but has no built-in Escape handling, so that part is still ours to add.
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) dropdown.value?.hide()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="column-menu">
    <button
      ref="toggleBtn"
      type="button"
      class="column-menu-toggle"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="Show or hide columns"
      @click="onToggleClick"
    >
      ⋮
    </button>
    <Dropdown ref="dropdown" v-model="open" :close="false" class="column-menu-panel">
      <li v-for="column in columns" :key="column.key" role="menuitemcheckbox" :aria-checked="column.visible" class="column-menu-item">
        <label>
          <input type="checkbox" :checked="column.visible" @change="emit('toggle', column.key)" />
          <span>{{ column.label ?? column.key }}</span>
        </label>
      </li>
    </Dropdown>
  </div>
</template>

<style scoped>
.column-menu {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 3;
}

.column-menu-toggle {
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: inherit;
  cursor: pointer;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 3px;
}

.column-menu-toggle:hover,
.column-menu-toggle:focus-visible {
  background: rgba(255, 255, 255, 0.3);
}

.column-menu-panel {
  min-width: 140px;
  max-height: 240px;
  overflow-y: auto;
  color: #000;
}

.column-menu-item {
  display: flex;
  align-items: center;
}

.column-menu-item label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  cursor: pointer;
}
</style>
