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
const powered = ref(true),
  level = ref(6);
let powerTimer = 0;
let previousTop: number | undefined;
let arrived = false;
const notes = [
  [
    'У цьому профілі перемикач дозволяє роботу двигунів (ARMED) або блокує їх (DISARMED).',
    'In this profile the switch arms or disarms the motors.',
  ],
  [
    'У Mode 2 вертикальний рух лівого стіка змінює тягу (Throttle). Горизонтальний задає поворот навколо вертикальної осі (Yaw).',
    'In Mode 2 the left stick controls thrust vertically and yaw horizontally. Yaw turns the nose left or right.',
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
  { id: 2, term: 'Throttle', x: 0, y: 1, arrow: 'up' },
  { id: 3, term: 'Pitch', x: 0, y: 1, arrow: 'up' },
  { id: 3, term: 'Roll', x: 1, y: 0, arrow: 'right' },
  { id: 3, term: 'Pitch', x: 0, y: -1, arrow: 'down' },
  { id: 3, term: 'Roll', x: -1, y: 0, arrow: 'left' },
  { id: 2, term: 'Yaw', x: 1, y: 0, arrow: 'cw' },
  { id: 2, term: 'Yaw', x: -1, y: 0, arrow: 'ccw' },
  ...['ANGLE', 'HORIZON', 'ACRO'].map((term, i) => ({
    id: 4,
    term,
    x: 0,
    y: i - 1,
    arrow: '',
  })),
  { id: 2, term: 'Throttle', x: 0, y: -1, arrow: 'down' },
  { id: 1, term: 'DISARMED', x: 0, y: 0, arrow: '' },
];
function open(i: number, event: MouseEvent) {
  if (!powered.value) return;
  if (i === 0 && complete.value) {
    manualArmed = !manualArmed;
    manualLift = false;
    clearTimeout(timer);
    pose(1, manualArmed ? 'ARMED' : 'DISARMED');
  } else preview(i, event);
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

let timer = 0;
let visible = false;
let hoverTimer = 0;
let skipped = false;
let touchY = 0;
const inputEvents = new AbortController();
function holdForward(distance: number) {
  if (
    distance <= 0 ||
    !powered.value ||
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
const complete = ref(false);
function pose(i: number, term = '', x = 0, y = 0, arrow = '') {
  active.value = i;
  screen.value = term;
  cue.value = arrow;
  const story = surface.value?.closest<HTMLElement>('[data-story]');
  if (!story) return;
  if (!term || term === 'DISARMED') {
    story.dataset.radioHeading = '0';
    if (!term) story.dataset.radioModePosition = '-1';
  }
  if (
    term === 'Yaw' &&
    story.dataset.radioArmed === 'true' &&
    (term !== story.dataset.radioTerm || String(x) !== story.dataset.radioX)
  ) {
    story.dataset.radioHeading = String(
      Number(story.dataset.radioHeading ?? 0) - x * Math.PI,
    );
  }
  if (i === 4) story.dataset.radioModePosition = String(y);
  if (term === 'ARMED') story.dataset.radioArmed = 'true';
  if (!term || !powered.value || term === 'DISARMED')
    story.dataset.radioArmed = 'false';
  story.dataset.radioTerm = term;
  story.dataset.radioCue = arrow;
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
  if (!visible || document.hidden || complete.value || !powered.value) return;
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
  clearTimeout(powerTimer);
  powered.value = true;
  level.value = 6;
  publishPower();
  previousTop = undefined;
  arrived = false;
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
function publishPower() {
  const story = surface.value?.closest<HTMLElement>('[data-story]');
  if (!story) return;
  story.dataset.radioPower = powered.value ? 'on' : 'off';
  story.dataset.radioLevel = String(level.value);
  story.dispatchEvent(new CustomEvent('radio-pose', { detail: active.value }));
}
function setPower(on: boolean) {
  if (powered.value === on) return;
  clearTimeout(powerTimer);
  clearTimeout(timer);
  cancelPreview();
  powered.value = on;
  manualArmed = manualLift = false;
  lastControl = -1;
  if (!on) complete.value = true;
  pose(0, on ? 'DISARMED' : '');
  const target = on ? 6 : 0;
  function step() {
    publishPower();
    if (level.value === target) return;
    powerTimer = window.setTimeout(() => {
      level.value += Math.sign(target - level.value);
      step();
    }, 115);
  }
  step();
}
function settle() {
  const box = surface.value?.getBoundingClientRect();
  const chapter = surface.value?.closest('.radio-chapter');
  if (chapter) {
    const rect = chapter.getBoundingClientRect();
    const threshold = -Math.max(
      innerHeight * 0.39,
      (rect.height - innerHeight) * 0.42,
    );
    if (
      previousTop !== undefined &&
      previousTop > threshold &&
      rect.top <= threshold &&
      arrived
    )
      setPower(false);
    if (rect.top <= threshold || rect.top > innerHeight * 0.5) arrived = false;
    previousTop = rect.top;
  }
  const arrival =
    !document.querySelector('[data-story][data-live]') ||
    (chapter && chapter.getBoundingClientRect().top <= -innerHeight * 0.12);
  const inside = Boolean(
    arrival &&
    box &&
    box.top <= innerHeight * 0.012 &&
    box.bottom >= innerHeight * 0.65,
  );
  if (inside) arrived = true;
  if (visible !== inside) {
    visible = inside;
    run();
  }
}
function preview(i: number, event?: MouseEvent | FocusEvent) {
  if (!powered.value) return;
  clearTimeout(hoverTimer);
  hover.value = i;
  if (event) place(event);
  if (!complete.value || i >= notes.length) return;
  clearTimeout(timer);
  if (lastControl !== i) {
    gesture++;
    lastControl = i;
  }
  if (i === 0) {
    pose(1, manualArmed ? 'ARMED' : 'DISARMED');
    return;
  }
  const strokes = phases.filter((p) => p.id === i + 1);
  const sample = strokes[gesture % strokes.length];
  if (i === 1 && manualArmed) manualLift = true;
  pose(i + 1, sample.term, sample.x, sample.y, sample.arrow);
  timer = window.setTimeout(() => {
    lastControl = -1;
    pose(0, manualArmed ? 'ARMED' : 'DISARMED');
  }, 1500);
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
  clearTimeout(powerTimer);
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
    :data-powered="powered"
    @keydown.esc="hover = null"
  >
    <div class="radio-pair">
      <span class="study-poster" role="img" aria-label="RadioMaster TX16S MK3">
        <img
          ref="poster"
          @load="alignPosterControls"
          loading="lazy"
          :src="
            base +
            'radio' +
            (!powered ? '-off' : active > 0 ? '-' + active : '') +
            '-dark.webp'
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
        type="button"
        class="radio-power"
        :aria-label="locale === 'uk' ? 'Живлення пульта' : 'Radio power'"
        :aria-pressed="powered"
        :style="{
          '--hot-x':
            'var(--power-x,var(--poster-' + (controls.length + 1) + '-x))',
          '--hot-y':
            'var(--power-y,var(--poster-' + (controls.length + 1) + '-y))',
        }"
        @pointerenter="setPower(true)"
        @focus="setPower(true)"
        @click="setPower(true)"
      />
      <i
        v-for="n in level"
        :key="'lamp' + n"
        aria-hidden="true"
        class="poster-indicator"
        :style="{
          left: 'var(--poster-' + (controls.length + 1 + n) + '-x)',
          top: 'var(--poster-' + (controls.length + 1 + n) + '-y)',
        }"
      />
      <button
        v-for="(control, i) in controls"
        :key="control.en"
        :disabled="!powered"
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
      ><template v-if="hover === 2"> · Pitch / Roll</template
      ><template v-if="hover >= notes.length">
        ·
        {{
          locale === 'uk'
            ? 'Призначення задає профіль моделі'
            : 'Assignable per model'
        }}</template
      ></span
    >
  </div>
</template>
