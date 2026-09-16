<script setup lang="ts">
// Reproduces jui-grid/examples/xtable_test.html: a very wide, horizontally-scrollable,
// empty grid with a grouped 2-row header (colspan/rowspan) used to stress-test header
// rendering. This is a representative subset of the original's ~200-column header
// (same group/leaf labels, fewer groups) rather than a byte-for-byte column count -
// the structural feature (nested/grouped column headers) is the same either way.
import VirtualGrid from '../components/VirtualGrid.vue'
import type { GridColumn } from '../types'

const columns: GridColumn[] = [
  { key: 'select', label: '선택', width: 60 },
  { key: 'year', label: '연도', width: 60 },
  { key: 'yearEndType', label: '연말정산구분', width: 90 },
  { key: 'empNo', label: '사번', width: 70 },
  { key: 'name', label: '성명', width: 80 },
  { key: 'hireDate', label: '입사일', width: 100 },
  {
    key: 'group-primary',
    label: '종근무지',
    children: [
      { key: 'primarySalary', label: '급여', width: 90 },
      { key: 'primaryBonus', label: '상여', width: 90 },
      { key: 'primaryRecognizedBonus', label: '인정상여', width: 90 },
      { key: 'primaryTotal', label: '합계', width: 90 },
    ],
  },
  {
    key: 'group-main',
    label: '주근무지',
    children: [
      { key: 'mainSalary', label: '급여', width: 90 },
      { key: 'mainBonus', label: '상여', width: 90 },
      { key: 'mainRecognizedBonus', label: '인정상여', width: 90 },
      { key: 'mainTotal', label: '합계', width: 90 },
    ],
  },
  {
    key: 'group-all',
    label: '전체',
    children: [
      { key: 'allSalary', label: '급여', width: 90 },
      { key: 'allBonus', label: '상여', width: 90 },
      { key: 'allRecognizedBonus', label: '인정상여', width: 90 },
      { key: 'allTotal', label: '합계', width: 90 },
    ],
  },
  {
    key: 'group-taxfree',
    label: '비과세',
    children: [
      { key: 'taxfreeYes', label: '명세작성(O)', width: 100 },
      { key: 'taxfreeNo', label: '명세작성(X)', width: 100 },
    ],
  },
  {
    key: 'group-deduction',
    label: '감면소득',
    children: [
      { key: 'deductionYes', label: '명세작성(O)', width: 100 },
      { key: 'deductionNo', label: '명세작성(X)', width: 100 },
    ],
  },
  { key: 'totalPay', label: '총급여', width: 90 },
  { key: 'earnedIncomeDeduction', label: '근로소득공제', width: 90 },
  { key: 'earnedIncomeAmount', label: '근로소득금액', width: 90 },
  {
    key: 'group-basic',
    label: '기본공제',
    children: [
      { key: 'basicSelf', label: '본인', width: 90 },
      { key: 'basicSpouse', label: '배우자', width: 90 },
      { key: 'basicDependentCount', label: '부양가족인원', width: 90 },
      { key: 'basicDependent', label: '부양가족', width: 90 },
    ],
  },
]
</script>

<template>
  <div>
    <h2>xtable_test.html</h2>
    <p class="desc">
      Grouped/multi-row header (colspan/rowspan) - a representative subset of the original's ~200-column header, same
      group/leaf structure.
    </p>

    <VirtualGrid :columns="columns" :rows="[]" mode="virtual" :height="300" resizable />
  </div>
</template>

<style scoped>
.desc {
  font-size: 12px;
  color: #666;
  max-width: 640px;
}
</style>
