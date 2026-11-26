<script setup lang="ts">
defineProps<{ text: string; compact?: string }>();
</script>

<template>
  <span class="action-label">
    <span>{{ text }}</span>
    <small v-if="compact">{{ compact }}</small>
  </span>
</template>
