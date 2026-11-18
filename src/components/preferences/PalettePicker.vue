<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  palettes,
  validPalette,
  savePreference,
  type Palette,
} from '../../lib/preferences';
defineProps<{ label: string }>();
const selected = ref<Palette>('signal');
onMounted(() => {
  const value = document.documentElement.dataset.palette;
  if (validPalette(value)) selected.value = value;
});
function select(value: Palette) {
  selected.value = value;
  document.documentElement.dataset.palette = value;
  savePreference('palette', value);
}
</script>
<template>
  <fieldset>
    <legend class="text-muted mb-5 font-mono text-sm tracking-widest uppercase">
      {{ label }}
    </legend>
    <div class="flex flex-wrap gap-3">
      <button
        v-for="palette in palettes"
        :key="palette"
        type="button"
        :aria-pressed="selected === palette"
        class="hover:border-accent border px-6 py-4 font-mono capitalize"
        :class="
          selected === palette
            ? 'border-accent text-accent'
            : 'border-line text-ink'
        "
        @click="select(palette)"
      >
        {{ palette }}
      </button>
    </div>
  </fieldset>
</template>
