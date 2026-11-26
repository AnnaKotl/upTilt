<script setup lang="ts">
import { usePageLanguage } from '../../lib/page-language';
import { radioControls as controls } from '../../data/radio-controls';
import { phases, demoFrames, leadInMs } from '../../data/radio-demo';
import posterControls from '../../data/radio-poster.json';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import type { Locale } from '../../lib/i18n';
import { usePointerNote } from '../../lib/usePointerNote';
import ActionLabel from '../ui/ActionLabel.vue';
import Icon from '../ui/Icon.vue';
import StudyLink from './StudyLink.vue';
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
let visibilityObserver: IntersectionObserver | undefined;
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
function open(i: number, event: MouseEvent) {
  if (!powered.value) return;
  if (i === 0 && canPractice.value) {
    manualArmed = !manualArmed;
    manualLift = false;
    clearTimeout(previewTimer);
    pose(1, manualArmed ? 'ARMED' : 'DISARMED');
  } else preview(i, event);
  chosen.value = i;
  modal.value?.show();
}
const { surface, place, noteAt } = usePointerNote();
const active = ref(0);
const hover = ref<number | null>(null);
const noteControl = computed(
  () =>
    hover.value ??
    (powered.value && !canPractice.value && [2, 3].includes(active.value)
      ? active.value - 1
      : null),
);
const controlNoteAt = computed(() => {
  if (hover.value !== null) return noteAt.value;
  const i = noteControl.value;
  return {
    left: `clamp(14px, calc(var(--control-${i}-x, var(--poster-${i}-x)) + 24px), 100% - 160px)`,
    top: `clamp(14px, calc(var(--control-${i}-y, var(--poster-${i}-y)) - 76px), 100% - 84px)`,
  };
});
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

let playbackTimer = 0;
let previewTimer = 0;
let visible = false;
let hoverTimer = 0;
const events = new AbortController();
const complete = ref(false);
const nextSectionVisible = ref(false);
const reducedMotion = ref(false);
const canPractice = computed(() => complete.value || reducedMotion.value);
const replayLabel = computed(() =>
  locale.value === 'uk' ? 'Повторити демонстрацію' : 'Replay demonstration',
);
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
  surface.value?.style.setProperty('--stick-x', String(x));
  surface.value?.style.setProperty('--stick-y', String(y));
  story.dataset.radioTerm = term;
  story.dataset.radioCue = arrow;
  story.dataset.radioIdle = String(
    canPractice.value && manualArmed && !manualLift,
  );
  story.dataset.radioX = String(x);
  story.dataset.radioY = String(y);
  story.dataset.radioPose = String(i);
  story.dispatchEvent(new CustomEvent('radio-pose', { detail: i }));
}
function run() {
  clearTimeout(playbackTimer);
  if (!visible || document.hidden || canPractice.value || !powered.value)
    return;
  playbackTimer = window.setTimeout(
    () => {
      const phase = demoFrames[next++];
      pose(phase.id, phase.term, phase.x, phase.y, phase.arrow);
      if (next === demoFrames.length) {
        complete.value = true;
        pose(0, 'DISARMED');
      } else run();
    },
    next === 0 ? leadInMs : demoFrames[next - 1].duration,
  );
}
function reset() {
  cancelPreview();
  clearTimeout(previewTimer);
  clearTimeout(powerTimer);
  powered.value = true;
  level.value = 6;
  publishPower();
  next = 0;
  manualArmed = false;
  manualLift = false;
  lastControl = -1;
  gesture = 0;
  complete.value = false;
  pose(0);
  run();
}
function replay(event: MouseEvent) {
  if (!complete.value || nextSectionVisible.value) return;
  if (event.detail === 0)
    surface.value?.querySelector('h2')?.focus({ preventScroll: true });
  reset();
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
  clearTimeout(playbackTimer);
  clearTimeout(previewTimer);
  cancelPreview();
  powered.value = on;
  manualArmed = manualLift = false;
  lastControl = -1;
  if (!on && !complete.value) next = 0;
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
// Observe the pinned study itself. Its chapter can span several viewports,
// and the same resting frame is reachable from either scroll direction.
function setVisible(inside: boolean) {
  if (visible === inside) return;
  visible = inside;
  setPower(inside);
  run();
}
function preview(i: number, event?: MouseEvent | FocusEvent) {
  if (!powered.value) return;
  clearTimeout(hoverTimer);
  hover.value = i;
  if (event) place(event);
  if (!canPractice.value || i >= notes.length) return;
  clearTimeout(previewTimer);
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
  previewTimer = window.setTimeout(() => {
    lastControl = -1;
    pose(0, manualArmed ? 'ARMED' : 'DISARMED');
  }, 1500);
}
onMounted(() => {
  const { signal } = events;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.value = motion.matches;
  motion.addEventListener(
    'change',
    () => {
      reducedMotion.value = motion.matches;
      reset();
    },
    { signal },
  );
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target === surface.value)
          setVisible(entry.intersectionRatio >= 0.5);
        else nextSectionVisible.value = entry.isIntersecting;
      }
    },
    { threshold: [0, 0.5], rootMargin: '0px 0px -1px 0px' },
  );
  visibilityObserver.observe(surface.value!);
  const nextSection = document.getElementById('display');
  if (nextSection) visibilityObserver.observe(nextSection);
  sizeObserver = new ResizeObserver(alignPosterControls);
  sizeObserver.observe(surface.value!);
  sizeObserver.observe(poster.value!);
  alignPosterControls();
  window.addEventListener('tour-restart', reset, { signal });
  window.addEventListener('scene-reset', reset, { signal });
  window.addEventListener('pageshow', run, { signal });
  document.addEventListener('visibilitychange', run, { signal });
});
onBeforeUnmount(() => {
  clearTimeout(powerTimer);
  clearTimeout(playbackTimer);
  clearTimeout(previewTimer);
  cancelPreview();
  events.abort();
  visibilityObserver?.disconnect();
  sizeObserver?.disconnect();
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
    <header class="radio-heading">
      <h2 class="section-title" tabindex="-1">
        {{
          locale === 'uk'
            ? 'Демонстрація керування коптером'
            : 'Drone control demonstration'
        }}
      </h2>
      <StudyLink :locale="locale" article="equipment/controls" />
    </header>
    <button
      class="radio-replay"
      type="button"
      :aria-label="replayLabel"
      :inert="!complete || !powered || nextSectionVisible"
      @click="replay"
    >
      <Icon name="replay" />
      <ActionLabel :text="replayLabel" aria-hidden="true" />
    </button>
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
      :locale="locale"
      :article="
        chosen === 1 || chosen === 2 ? 'equipment/sticks' : 'equipment/controls'
      "
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
    <Transition name="note-fade"
      ><span
        v-if="noteControl !== null"
        id="control-note"
        role="tooltip"
        class="cursor-note"
        :style="controlNoteAt"
        >{{ controls[noteControl][locale]
        }}<template v-if="noteControl === 1"
          ><br />↕ Throttle · {{ locale === 'uk' ? 'тяга' : 'thrust' }}<br />↔
          Yaw ·
          {{ locale === 'uk' ? 'поворот носа' : 'turn the nose' }}</template
        ><template v-if="noteControl === 2"
          ><br />↕ Pitch · {{ locale === 'uk' ? 'нахил носа' : 'tilt the nose'
          }}<br />↔ Roll ·
          {{ locale === 'uk' ? 'крен убік' : 'bank sideways' }}</template
        ><template v-if="noteControl >= notes.length">
          ·
          {{
            locale === 'uk'
              ? 'Призначення задає профіль моделі'
              : 'Assignable per model'
          }}</template
        ></span
      >
    </Transition>
  </div>
</template>
