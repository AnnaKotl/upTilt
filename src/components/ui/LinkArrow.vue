<script setup lang="ts">
import Icon from './Icon.vue';
</script>
<template><Icon name="forward" class="link-arrow" /></template>
<style>
.link-arrow {
  display: inline-block;
  flex: none;
  width: max(1.15rem, 1em);
  height: max(1.15rem, 1em);
  vertical-align: -0.15em;
  stroke-width: 2;
  rotate: -45deg;
  transition: translate var(--ui-motion);
}
a:is(:hover, :focus-visible) .link-arrow {
  translate: 0.12rem -0.12rem;
}
</style>
