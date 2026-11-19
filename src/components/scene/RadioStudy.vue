<script setup lang="ts">
import { usePageLanguage } from '../../lib/page-language';
import { radioControls as controls } from '../../data/radio-controls';
import posterControls from '../../data/radio-poster.json';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { Locale } from '../../lib/i18n';
import { usePointerNote } from '../../lib/usePointerNote';
import StudyNote from './StudyNote.vue';
const input = defineProps<{ locale: Locale }>();
const locale = usePageLanguage(input.locale);
const modal = ref<InstanceType<typeof StudyNote>>(),
  chosen = ref(0),
  screen = ref(''),
  cue = ref('');
const notes = [
  [
    'Перемикач фіксується в обраному положенні. Тут він перемикає стан моделі.',
    'A switch stays in position. Here it changes the state of the model.',
  ],
  [
    'Throttle — тяга. Yaw — поворот навколо вертикальної осі.',
    'Throttle changes thrust. Yaw turns the nose left or right.',
  ],
  [
    'Pitch — нахил носа вперед і назад. Roll — крен ліворуч або праворуч.',
    'Pitch tilts the nose up or down. Roll banks the quad left or right.',
  ],
  [
    'ANGLE вирівнює коптер, коли стік повертається в центр. HORIZON поєднує самовирівнювання й вільніший нахил. В ACRO стік задає швидкість обертання.',
    'Angle mode self-levels when the stick returns to centre. Horizon blends self-levelling with rate control. In Acro the stick commands a rotation rate.',
  ],
];
const switchNote = [
  'Призначення цього перемикача залежить від профілю моделі в передавачі.',
  'The model profile determines what this switch does.',
];
const cueRotation: Record<string, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: -90,
};
const phases = [
  { id: 1, term: 'ARMED', x: 0, y: 0, arrow: '' },
  { id: 3, term: 'Pitch', x: 0, y: 1, arrow: 'up' },
  { id: 3, term: 'Roll', x: 1, y: 0, arrow: 'right' },
  { id: 3, term: 'Pitch', x: 0, y: -1, arrow: 'down' },
  { id: 3, term: 'Roll', x: -1, y: 0, arrow: 'left' },
  { id: 2, term: 'Throttle', x: 0, y: 1, arrow: 'up' },
  { id: 2, term: 'Yaw', x: 1, y: 0, arrow: 'cw' },
  { id: 2, term: 'Throttle', x: 0, y: -1, arrow: 'down' },
  { id: 2, term: 'Yaw', x: -1, y: 0, arrow: 'ccw' },
  ...['ANGLE', 'HORIZON', 'ACRO'].map((term, i) => ({
    id: 4,
    term,
    x: 0,
    y: i - 1,
    arrow: '',
  })),
  ...controls
    .slice(4)
    .map((_, index) => ({ id: index + 5, term: 'SW', x: 0, y: 0, arrow: '' })),
  { id: 2, term: 'Throttle', x: 0, y: -1, arrow: 'down' },
  { id: 1, term: 'DISARMED', x: 0, y: 0, arrow: '' },
];
function open(i: number, event: MouseEvent) {
  preview(i, event);
  chosen.value = i;
  modal.value?.show();
}
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
  scene.style.setProperty(
    '--poster-screen-x',
    box.left -
      bounds.left +
      (box.width - w) / 2 +
      posterControls[controls.length].x * w +
      'px',
  );
  scene.style.setProperty(
    '--poster-screen-y',
    box.top -
      bounds.top +
      (box.height - h) / 2 +
      posterControls[controls.length].y * h +
      'px',
  );
  posterControls.slice(0, controls.length).forEach(({ x, y }, i) => {
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

let timer = 0;
let visible = false;
let hoverTimer = 0;
let skipped = false;
let touchY = 0;
const inputEvents = new AbortController();
function holdForward(distance: number) {
  if (
    distance <= 0 ||
    complete.value ||
    skipped ||
    next >= Math.ceil(phases.length / 3) ||
    !surface.value?.closest('[data-live]') ||
    document.querySelector('dialog[open]') ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return false;
  const top = surface.value
    .closest('.radio-chapter')!
    .getBoundingClientRect().top;
  const remaining = top + innerHeight * 0.12;
  if (remaining > distance || top < -innerHeight * 0.9) return false;
  if (remaining > 0)
    window.scrollBy({ top: Math.ceil(remaining), behavior: 'instant' });
  settle();
  return true;
}
function delayedPreview(i: number, event: PointerEvent) {
  cancelPreview();
  place(event);
  if (event.pointerType === 'mouse')
    hoverTimer = window.setTimeout(() => preview(i), 230);
}
function cancelPreview() {
  clearTimeout(hoverTimer);
  hover.value = null;
}
let next = 0,
  manualArmed = false,
  manualLift = false,
  lastControl = -1,
  gesture = 0;
const modeNames = ['ANGLE', 'HORIZON', 'ACRO'];
const complete = ref(false);
function pose(i: number, term = '', x = 0, y = 0, arrow = '') {
  active.value = i;
  screen.value = term;
  cue.value = arrow;
  const story = surface.value?.closest<HTMLElement>('[data-story]');
  if (!story) return;
  story.dataset.radioTerm = term;
  story.dataset.radioCue = arrow;
  story.dataset.radioLanded = String(term === 'DISARMED');
  story.dataset.radioIdle = String(
    complete.value && manualArmed && !manualLift,
  );
  story.dataset.radioX = String(x);
  story.dataset.radioY = String(y);
  story.dataset.radioPose = String(i);
  story.dispatchEvent(new CustomEvent('radio-pose', { detail: i }));
}
function run() {
  clearTimeout(timer);
  if (!visible || document.hidden || complete.value) return;
  timer = window.setTimeout(
    () => {
      const phase = phases[next++];
      pose(phase.id, phase.term, phase.x, phase.y, phase.arrow);
      if (next === phases.length) {
        complete.value = true;
        pose(0, 'DISARMED');
      } else run();
    },
    next === 0 ? 1400 : 1480,
  );
}
function reset() {
  next = 0;
  skipped = false;
  manualArmed = false;
  manualLift = false;
  lastControl = -1;
  gesture = 0;
  complete.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
  pose(0);
  run();
}
function settle() {
  const box = surface.value?.getBoundingClientRect();
  const chapter = surface.value?.closest('.radio-chapter');
  const arrival =
    !document.querySelector('[data-story][data-live]') ||
    (chapter && chapter.getBoundingClientRect().top <= -innerHeight * 0.12);
  const inside = Boolean(
    arrival &&
    box &&
    box.top <= innerHeight * 0.012 &&
    box.bottom >= innerHeight * 0.65,
  );
  if (visible !== inside) {
    visible = inside;
    run();
  }
}
function preview(i: number, event?: MouseEvent | FocusEvent) {
  clearTimeout(hoverTimer);
  hover.value = i;
  if (event) place(event);
  if (!complete.value) return;
  clearTimeout(timer);
  if (lastControl !== i) {
    gesture++;
    lastControl = i;
  }
  if (i === 0) {
    manualArmed = true;
    manualLift = false;
    pose(1, 'ARMED');
    return;
  }
  const strokes = phases.filter((p) => p.id === i + 1);
  const sample = strokes[gesture % Math.max(1, strokes.length)];
  if (i === 1) manualLift = true;
  const term = i === 3 ? modeNames[gesture % 3] : (sample?.term ?? 'SW');
  pose(i + 1, term, sample?.x ?? 0, sample?.y ?? 0, sample?.arrow ?? '');
  timer = window.setTimeout(
    () => pose(0, manualArmed || manualLift ? 'ARMED' : 'DISARMED'),
    1500,
  );
}
onMounted(() => {
  const signal = inputEvents.signal;
  window.addEventListener(
    'wheel',
    (event) => {
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      if (!event.ctrlKey && holdForward(event.deltaY * unit))
        event.preventDefault();
    },
    { passive: false, signal },
  );
  window.addEventListener(
    'touchstart',
    (e) => {
      touchY = e.touches[0].clientY;
    },
    { passive: true, signal },
  );
  window.addEventListener(
    'touchmove',
    (e) => {
      const y = e.touches[0].clientY;
      if (e.touches.length === 1 && holdForward(touchY - y)) e.preventDefault();
      touchY = y;
    },
    { passive: false, signal },
  );
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && visible) skipped = true;
      if (
        e.defaultPrevented ||
        e.shiftKey ||
        e.altKey ||
        e.metaKey ||
        e.ctrlKey ||
        (e.target instanceof HTMLElement &&
          e.target.closest(
            'input,textarea,select,button,a,[contenteditable="true"]',
          ))
      )
        return;
      const distance =
        e.key === 'ArrowDown'
          ? 48
          : ['PageDown', ' '].includes(e.key)
            ? innerHeight
            : 0;
      if (holdForward(distance)) e.preventDefault();
    },
    { signal },
  );
  sizeObserver = new ResizeObserver(alignPosterControls);
  sizeObserver.observe(surface.value!);
  sizeObserver.observe(poster.value!);
  alignPosterControls();
  complete.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('scroll', settle, { passive: true });
  window.addEventListener('tour-restart', reset);
  window.addEventListener('scene-reset', reset);
  settle();
  document.addEventListener('visibilitychange', run);
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  cancelPreview();
  inputEvents.abort();
  window.removeEventListener('scroll', settle);
  window.removeEventListener('tour-restart', reset);
  window.removeEventListener('scene-reset', reset);
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
    <span class="radio-screen" aria-hidden="true"
      ><svg
        v-if="cue"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        stroke-width="3.4"
        stroke-linejoin="round"
        stroke-linecap="round"
      >
        <g
          v-if="cue in cueRotation"
          :transform="'rotate(' + cueRotation[cue] + ' 24 24)'"
        >
          <path d="M24 39V9m-10 10L24 9l10 10" />
        </g>
        <g
          v-else
          :transform="cue === 'ccw' ? 'translate(48 0) scale(-1 1)' : undefined"
        >
          <path d="M34 36a15 15 0 1 1 5-11m-9-9 9 9 8-9" />
        </g></svg
      >{{ screen }}</span
    >
    <StudyNote
      ref="modal"
      :title="controls[chosen][locale]"
      :body="(chosen < 4 ? notes[chosen] : switchNote)[locale === 'uk' ? 0 : 1]"
      :back="locale === 'uk' ? 'До пульта' : 'Back to the radio'"
    />
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
        @pointerenter="delayedPreview(i, $event)"
        @pointermove="place"
        @pointerleave="cancelPreview"
        @focus="preview(i, $event)"
        @blur="cancelPreview"
        @click="open(i, $event)"
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
