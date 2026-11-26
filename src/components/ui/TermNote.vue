<script setup lang="ts">
import { ref } from 'vue';
defineProps<{ note: string }>();
const open = ref(false);
</script>

<template>
  <span
    class="term-note"
    tabindex="0"
    @pointerenter="open = true"
    @pointerleave="open = false"
    @focus="open = true"
    @blur="open = false"
    @keydown.esc="open = false"
  >
    <slot />
    <Transition name="note-fade">
      <span v-if="open" class="term-tip cursor-note" role="tooltip">{{
        note
      }}</span>
    </Transition>
  </span>
</template>

<style scoped>
.term-note {
  position: relative;
  cursor: help;
  border-bottom: 1px dotted color-mix(in srgb, currentColor 55%, transparent);
}
.term-note:is(:hover, :focus-visible) {
  color: var(--accent);
  outline: none;
}
.term-tip {
  position: absolute;
  z-index: 4;
  bottom: calc(100% + 0.45rem);
  left: 0;
  width: max-content;
  max-width: min(21rem, 60vw);
  white-space: normal;
  text-align: left;
  font: 500 0.78rem/1.45 var(--font-sans);
  color: var(--ink);
}
</style>
