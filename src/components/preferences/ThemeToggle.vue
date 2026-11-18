<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Icon from '../ui/Icon.vue';
import { savePreference } from '../../lib/preferences';
defineProps<{ label: string }>();
const light = ref(false);
onMounted(() => {
  light.value = document.documentElement.dataset.theme === 'light';
});
function toggle() {
  light.value = !light.value;
  const theme = light.value ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  savePreference('theme', theme);
}
</script>
<template>
  <button
    class="edge-tab"
    type="button"
    role="switch"
    :aria-checked="light"
    :aria-label="label"
    @click="toggle"
  >
    <Icon :name="light ? 'sun' : 'moon'" /><span class="hint">{{ label }}</span>
  </button>
</template>
