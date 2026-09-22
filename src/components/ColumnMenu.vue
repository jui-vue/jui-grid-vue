<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
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

async function onToggleClick() {
  if (open.value) {
    dropdown.value?.hide()
    return
  }

  const btn = toggleBtn.value
  if (!btn) return
  const top = btn.offsetTop + btn.offsetHeight + 4
  // 먼저 버튼의 왼쪽 끝에 맞춰 연다 - 실제 렌더된 패널 폭은 열어보기 전엔 모른다(라벨 길이에 따라
  // 늘어날 수 있어 CSS min-width로는 못 미리 안다).
  dropdown.value?.show(btn.offsetLeft, top)
  await nextTick()
  // 이 토글 버튼은 테이블 오른쪽 끝(top:4px;right:4px)에 있어서, 패널을 왼쪽 정렬로 그대로 두면
  // 테이블/iframe 뷰포트 밖으로 튀어나가 완전히 안 보이게 된다(실제로 겪은 버그) - 버튼의 오른쪽
  // 끝에 패널의 오른쪽 끝을 맞춰서 항상 컨테이너 안쪽으로 펼쳐지게 한다.
  // panelEl(.column-menu-panel) 자신이 아니라 그 안의 <ul>의 폭을 써야 한다 - ul이
  // position:absolute라 래퍼가 min-width만큼 더 넓어도 그 안에서 왼쪽 정렬로만 떠 있고, 래퍼
  // 기준으로 우측 정렬하면 실제 보이는 내용물은 그만큼 왼쪽으로 밀려나 버튼과 떨어져 보인다.
  const ulEl = btn.parentElement?.querySelector<HTMLElement>('.column-menu-panel ul')
  if (ulEl) {
    const left = btn.offsetLeft + btn.offsetWidth - ulEl.offsetWidth
    dropdown.value?.move(left, top)
  }
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
  color: #000;
}

/* Dropdown의 <ul>은 position:absolute라 .column-menu-panel 자신의 높이/폭에 기여하지 않는다 -
   min-width/max-height/overflow는(짧은 목록도 너무 좁지 않게, 많은 컬럼일 때 스크롤 필요)
   래퍼가 아니라 실제 콘텐츠인 ul 자체에 줘야 한다. 래퍼에 두면 0 높이 기준으로 overflow:auto가
   전부 잘라버리고("⋮" 버튼을 눌러도 패널이 완전히 안 보였다), min-width도 래퍼만 넓힐 뿐 왼쪽
   정렬된 ul은 그 안에서 그대로라 우측 정렬 계산이 실제 내용물과 어긋나 버튼과 멀어져 보인다 -
   둘 다 실제로 겪은 버그다. */
.column-menu-panel :deep(ul) {
  min-width: 140px;
  max-height: 240px;
  overflow-y: auto;
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
