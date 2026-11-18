<script setup lang="ts">
import { radioControls as controls } from '../../data/radio-controls';
import posterControls from '../../data/radio-poster.json';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { Locale } from '../../lib/i18n';
import { usePointerNote } from '../../lib/usePointerNote';
defineProps<{ locale: Locale }>();
const { surface, place, noteAt } = usePointerNote();
const active = ref(0);
const hover = ref<number | null>(null);
const base = import.meta.env.BASE_URL + 'media/study/';
const poster = ref<HTMLImageElement>();
let sizeObserver: ResizeObserver | undefined;
function alignPosterControls() {
  const img = poster.value,
    scene = surface.value;
  if (!img?.naturalWidth || !scene) return;
  const box = img.getBoundingClientRect(),
    bounds = scene.getBoundingClientRect();
  const scale = Math.min(
    box.width / img.naturalWidth,
    box.height / img.naturalHeight,
  );
  const w = img.naturalWidth * scale,
    h = img.naturalHeight * scale;
  posterControls.forEach(({ x, y }, i) => {
    scene.style.setProperty(
      '--poster-' + i + '-x',
      box.left - bounds.left + (box.width - w) / 2 + x * w + 'px',
    );
    scene.style.setProperty(
      '--poster-' + i + '-y',
      box.top - bounds.top + (box.height - h) / 2 + y * h + 'px',
    );
  });
}
let observer: IntersectionObserver | undefined;
let timer = 0;
let visible = false;
let next = 1;
const complete = ref(false);
function pose(i: number) {
  active.value = i;
  const story = surface.value?.closest<HTMLElement>('[data-story]');
  if (story) {
    story.dataset.radioPose = String(i);
    story.dispatchEvent(new CustomEvent('radio-pose', { detail: i }));
  }
}
function run() {
  clearTimeout(timer);
  if (!visible || document.hidden || complete.value) return;
  timer = window.setTimeout(
    () => {
      if (next > controls.length) {
        complete.value = true;
        pose(0);
      } else {
        pose(next++);
        run();
      }
    },
    next === 1 ? 450 : 775,
  );
}
function preview(i: number, event: MouseEvent | FocusEvent) {
  hover.value = i;
  place(event);
  if (!complete.value) return;
  clearTimeout(timer);
  pose(i + 1);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    timer = window.setTimeout(() => pose(0), 1050);
}
onMounted(() => {
  sizeObserver = new ResizeObserver(alignPosterControls);
  sizeObserver.observe(surface.value!);
  sizeObserver.observe(poster.value!);
  alignPosterControls();
  complete.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
  observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      run();
    },
    { threshold: 0.55 },
  );
  observer.observe(surface.value!);
  document.addEventListener('visibilitychange', run);
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  observer?.disconnect();
  sizeObserver?.disconnect();
  document.removeEventListener('visibilitychange', run);
});
</script>
<template>
  <div
    ref="surface"
    class="radio-study"
    :data-pose="active"
    :data-complete="complete"
    @keydown.esc="hover = null"
  >
    <div class="radio-pair">
      <span class="study-poster" role="img" aria-label="RadioMaster TX16S MK3">
        <img
          ref="poster"
          @load="alignPosterControls"
          loading="lazy"
          :src="
            base + 'radio' + (active > 0 ? '-' + active : '') + '-dark.webp'
          "
          alt=""
        /> </span
      ><slot />
    </div>
    <div class="radio-controls">
      <button
        v-for="(control, i) in controls"
        :key="control.en"
        :class="control.kind"
        type="button"
        :style="{
          '--hot-x': 'var(--control-' + i + '-x,var(--poster-' + i + '-x))',
          '--hot-y': 'var(--control-' + i + '-y,var(--poster-' + i + '-y))',
        }"
        :aria-label="control[locale]"
        :aria-describedby="hover === i ? 'control-note' : undefined"
        @pointerenter="preview(i, $event)"
        @pointermove="place"
        @pointerleave="hover = null"
        @focus="preview(i, $event)"
        @blur="hover = null"
        @click="preview(i, $event)"
      />
    </div>
    <span
      v-if="hover !== null"
      id="control-note"
      role="tooltip"
      class="cursor-note"
      :style="noteAt"
      >{{ controls[hover][locale]
      }}<template v-if="hover === 1"> · Throttle / Yaw</template
      ><template v-if="hover === 2"> · Pitch / Roll</template></span
    >
  </div>
</template>
