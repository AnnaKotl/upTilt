<script setup lang="ts">
import Icon from './Icon.vue';
// Horizontal means the link keeps you inside the atlas. Angled means it leaves
// the atlas or opens a new tab, so the glyph alone tells you which it is.
defineProps<{ external?: boolean }>();
</script>
<template>
  <Icon
    name="forward"
    class="link-arrow"
    :class="{ 'link-arrow-out': external }"
  />
</template>
<style>
.link-arrow {
  display: inline-block;
  flex: none;
  width: max(1.15rem, 1em);
  height: max(1.15rem, 1em);
  vertical-align: -0.15em;
  stroke-width: 2;
  transition: translate var(--ui-motion);
}
a:is(:hover, :focus-visible) .link-arrow {
  translate: 0.12rem 0;
}
.link-arrow-out {
  rotate: -45deg;
}
/* The individual transform properties apply before rotate, so the nudge still
   reads as up and to the right. */
a:is(:hover, :focus-visible) .link-arrow-out {
  translate: 0.12rem -0.12rem;
}
</style>
