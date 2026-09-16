<script setup lang="ts">
defineProps<{ log: string[] }>()
</script>

<template>
  <div class="example-log">
    <h4>Event log</h4>
    <ul>
      <li v-for="(l, i) in log" :key="i">{{ l }}</li>
    </ul>
  </div>
</template>

<style scoped>
.example-log {
  margin-top: 24px;
  font-size: 12px;
}
.example-log h4 {
  margin-bottom: 4px;
}
.example-log ul {
  padding-left: 16px;
  margin: 0;
}
</style>
