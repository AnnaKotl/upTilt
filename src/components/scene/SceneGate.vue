<script setup lang="ts">
import { shallowRef, ref, onErrorCaptured, type Component } from 'vue';
import DroneDiagram from './DroneDiagram.vue';
defineProps<{ label: string; loadLabel: string; simpleLabel: string }>();
const scene = shallowRef<Component>();
const busy = ref(false);
function reset() {
  scene.value = undefined;
  busy.value = false;
}
onErrorCaptured(() => {
  reset();
  return false;
});
async function load() {
  if (!window.matchMedia('(min-width: 1024px)').matches) return;
  busy.value = true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    scene.value = (await import('./StudyScene.vue')).default;
  } catch {
    reset();
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="relative aspect-[5/3] w-full">
    <component :is="scene" v-if="scene" /><DroneDiagram v-else :label="label" />
    <div class="absolute right-4 bottom-4 hidden lg:block">
      <button
        v-if="!scene"
        type="button"
        :disabled="busy"
        class="border-line bg-surface text-accent hover:border-accent border px-4 py-3 font-mono text-xs disabled:opacity-50"
        @click="load"
      >
        {{ loadLabel }}</button><button
        v-else
        type="button"
        class="border-line bg-surface text-accent border px-4 py-3 font-mono text-xs"
        @click="reset"
      >
        {{ simpleLabel }}
      </button>
    </div>
  </div>
</template>
