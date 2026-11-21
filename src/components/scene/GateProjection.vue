<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { gatePoint, gateYaw } from '../../data/flight-path';
import {
  laps,
  lapPoint,
  ringDiameter,
  sampleLap,
  type Point,
} from '../../data/gate-replays';
import { usePageLanguage } from '../../lib/page-language';
import type { Locale } from '../../lib/i18n';

const props = defineProps<{ locale: Locale }>();
const locale = usePageLanguage(props.locale);
const uk = computed(() => locale.value === 'uk');
const surface = ref<HTMLElement>();
const stage = ref<HTMLElement>();
const live = ref(false);
const studying = ref(false);
const size = ref({ x: 1280, y: 800 });
const selected = ref(0);
const step = ref(75);
let resize: ResizeObserver | undefined;
let state: MutationObserver | undefined;

onMounted(() => {
  const story = surface.value!.closest<HTMLElement>('[data-story]')!;
  stage.value = story.querySelector<HTMLElement>('.scene-stage')!;
  const update = () => {
    live.value = !!story.dataset.live;
    studying.value = !live.value || story.dataset.gatePhase === 'study';
    if (!studying.value) {
      selected.value = 0;
      step.value = 75;
    }
    const el = live.value ? stage.value! : surface.value!;
    const x = el.clientWidth,
      y = el.clientHeight;
    if (x && y && (x !== size.value.x || y !== size.value.y))
      size.value = { x, y };
  };
  resize = new ResizeObserver(update);
  resize.observe(surface.value!);
  resize.observe(stage.value);
  state = new MutationObserver(update);
  state.observe(story, {
    attributes: true,
    attributeFilter: ['data-live', 'data-gate-phase'],
  });
  update();
});
onBeforeUnmount(() => {
  resize?.disconnect();
  state?.disconnect();
});

const width = computed(() => (10 * size.value.x) / size.value.y);
const scale = computed(() => (ringDiameter(width.value) * size.value.y) / 10);
const origin = computed(() => ({
  x: size.value.x * 0.58,
  y: size.value.y * 0.435,
}));
function project([x, y]: Point) {
  return {
    x: origin.value.x + x * scale.value,
    y: origin.value.y - y * scale.value,
  };
}
const tracks = computed(() =>
  laps.map((_, i) =>
    sampleLap(i, width.value).map((station) => ({
      ...station,
      ...project(station.point),
    })),
  ),
);
const ticks = computed(() =>
  Array.from(
    { length: Math.floor(laps[selected.value].duration / 0.25) },
    (_, i) =>
      project(
        lapPoint(
          selected.value,
          ((i + 1) * 0.25) / laps[selected.value].duration,
          width.value,
        ),
      ),
  ),
);
const active = computed(() => tracks.value[selected.value][step.value]);
const paths = computed(() =>
  tracks.value.map((track) =>
    track.map(({ x, y }) => x.toFixed(1) + ',' + y.toFixed(1)).join(' '),
  ),
);
const primaryPath = computed(() =>
  Array.from({ length: 81 }, (_, i) => {
    const [x, y] = gatePoint(0.48 + i / 160, width.value);
    return (
      ((0.5 + x / width.value) * size.value.x).toFixed(1) +
      ',' +
      ((0.5 - y / 10) * size.value.y).toFixed(1)
    );
  }).join(' '),
);
const velocity = computed(() => {
  const i = selected.value,
    t = active.value.fraction;
  const lo = Math.max(0, t - 0.001),
    hi = Math.min(1, t + 0.001);
  const a = lapPoint(i, lo, width.value),
    b = lapPoint(i, hi, width.value);
  const dt = (hi - lo) * laps[i].duration;
  const [x, y, z] = a.map((value, axis) => (b[axis] - value) / dt);
  return { x, y, speed: Math.hypot(x, y, z) };
});
const arrow = computed(() => {
  const { x, y } = velocity.value;
  return {
    x: active.value.x + 0.1 * x * scale.value,
    y: active.value.y - 0.1 * y * scale.value,
  };
});
const fmt = (value: number) =>
  value.toLocaleString(uk.value ? 'uk-UA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const time = computed(
  () => active.value.fraction * laps[selected.value].duration,
);
function probe(event: PointerEvent) {
  if (!studying.value || !(event.currentTarget instanceof SVGElement)) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) * size.value.x) / rect.width;
  const y = ((event.clientY - rect.top) * size.value.y) / rect.height;
  let best = 24 * 24;
  let lap = selected.value;
  let station = step.value;
  // Earlier entries win ties, so an intersection keeps the selected pass.
  for (const i of [lap, ...laps.keys()]) {
    tracks.value[i].forEach((p, j) => {
      const distance = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (distance < best) {
        best = distance;
        lap = i;
        station = j;
      }
    });
  }
  selected.value = lap;
  step.value = station;
}
</script>

<template>
  <figure
    ref="surface"
    class="gate-study"
    :class="{ 'is-live': live, 'is-ready': studying }"
    :inert="!studying"
    :aria-label="uk ? 'Кінематика прольоту' : 'Flight kinematics'"
  >
    <Teleport :to="stage || 'body'" :disabled="!stage || !live">
      <svg
        class="gate-sheet"
        :class="{ 'is-ready': studying }"
        :viewBox="`0 0 ${size.x} ${size.y}`"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="gate-minor"
            :x="origin.x"
            :y="origin.y"
            :width="scale / 8"
            :height="scale / 8"
            patternUnits="userSpaceOnUse"
          >
            <path
              :d="`M0 ${scale / 8}V0H${scale / 8}`"
              fill="none"
              stroke="currentColor"
              opacity=".16"
            />
          </pattern>
          <pattern
            id="gate-major"
            :x="origin.x"
            :y="origin.y"
            :width="scale / 2"
            :height="scale / 2"
            patternUnits="userSpaceOnUse"
          >
            <path
              :d="`M0 ${scale / 2}V0H${scale / 2}`"
              fill="none"
              stroke="currentColor"
              opacity=".26"
            />
          </pattern>
          <marker
            id="velocity-tip"
            orient="auto"
            refX="5"
            refY="3"
            markerWidth="6"
            markerHeight="6"
          >
            <path d="M0 0 6 3 0 6Z" fill="context-stroke" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#gate-minor)" />
        <rect width="100%" height="100%" fill="url(#gate-major)" />
        <path
          :d="`M0 ${origin.y}H${size.x} M${origin.x} 0V${size.y}`"
          class="datum"
        />
        <g class="axis-letters">
          <text :x="size.x - 24" :y="origin.y - 8">x</text>
          <text :x="origin.x + 8" y="23">y</text>
        </g>
        <g
          v-if="!live"
          class="ring-outline"
          :transform="`translate(${origin.x} ${origin.y})`"
        >
          <path
            :d="`M0 ${scale / 2}v${scale * 0.27}m-${scale * 0.15} 0h${scale * 0.3}`"
          />
          <ellipse :rx="(scale / 2) * Math.cos(gateYaw)" :ry="scale / 2" />
        </g>
        <g class="lap-lines" fill="none">
          <polyline
            v-for="(points, i) in paths"
            :key="i"
            :points="points"
            :stroke="laps[i].color"
            :class="{ 'current-lap': i === selected }"
          />
          <polyline :points="primaryPath" class="primary-path" />
        </g>
        <g :fill="laps[selected].color" opacity=".8">
          <circle
            v-for="(tick, i) in ticks"
            :key="i"
            :cx="tick.x"
            :cy="tick.y"
            r="2.7"
          />
        </g>
        <g
          :transform="`translate(${origin.x + scale * 0.49},${origin.y})`"
          class="dimension"
        >
          <path :d="`M0 ${-scale / 2}v${scale}m-4 0h8M-4 ${-scale / 2}h8`" />
          <text x="8" y="-7">D</text>
        </g>
        <g :style="{ '--lap': laps[selected].color }" class="station">
          <line
            :x1="active.x"
            :y1="active.y"
            :x2="arrow.x"
            :y2="arrow.y"
            marker-end="url(#velocity-tip)"
          />
          <circle :cx="active.x" :cy="active.y" r="5" />
          <text :x="arrow.x" :y="arrow.y - 9">v</text>
        </g>
      </svg>
    </Teleport>
    <template v-if="studying">
      <svg
        class="gate-hit"
        :viewBox="`0 0 ${size.x} ${size.y}`"
        aria-hidden="true"
        @pointermove="probe"
        @pointerdown="probe"
      >
        <polyline v-for="(points, i) in paths" :key="i" :points="points" />
      </svg>
      <figcaption>
        <span>{{ uk ? 'Кінематика прольоту' : 'Flight kinematics' }}</span>
        <small>{{ uk ? 'D — діаметр кільця' : 'D = gate diameter' }}</small>
      </figcaption>
      <div class="lap-controls" :style="{ '--lap': laps[selected].color }">
        <div
          class="lap-pick"
          role="group"
          :aria-label="uk ? 'Попередні прольоти' : 'Previous passes'"
        >
          <span
            >{{ uk ? 'Проліт' : 'Pass' }}
            {{ String(selected + 1).padStart(2, '0') }}</span
          >
          <button
            v-for="(lap, i) in laps"
            :key="lap.color"
            :style="{ '--lap': lap.color }"
            :aria-pressed="i === selected"
            :aria-label="(uk ? 'Проліт ' : 'Pass ') + (i + 1)"
            @click="selected = i"
          ></button>
        </div>
        <div class="measurements">
          <span
            ><em>{{ uk ? 'Час' : 'Time' }}</em> <b>{{ fmt(time) }}</b>
            {{ uk ? 'с' : 's' }}</span
          >
          <span
            ><em>{{ uk ? 'Шлях' : 'Distance' }}</em>
            <b>{{ fmt(active.length) }}</b> D</span
          >
          <span
            ><em>{{ uk ? 'Швидкість' : 'Speed' }}</em>
            <b>{{ fmt(velocity.speed) }}</b> D/{{ uk ? 'с' : 's' }}</span
          >
        </div>
        <input
          type="range"
          min="0"
          max="120"
          v-model.number="step"
          :aria-label="uk ? 'Час від початку прольоту' : 'Time since launch'"
          :aria-valuetext="fmt(time) + (uk ? ' с' : ' s')"
        />
        <small
          >v = ds/dt <span class="time-key">●</span>
          {{ uk ? 'кожні 0,25 с' : 'every 0.25 s' }}</small
        >
      </div>
    </template>
  </figure>
</template>
<style scoped>
.gate-study,
.gate-sheet,
.gate-hit {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  pointer-events: none;
}
.gate-study.is-live {
  position: fixed;
  z-index: 1;
}
.gate-study,
.gate-sheet {
  color: var(--muted);
  font: 500 0.75rem/1.4 var(--font-mono);
}
.gate-sheet {
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.55s,
    visibility 0.55s;
}
.gate-sheet.is-ready {
  visibility: visible;
  opacity: 1;
}
.gate-sheet .datum,
.dimension path {
  stroke: currentColor;
  fill: none;
  stroke-width: 1;
  opacity: 0.52;
}
.datum {
  stroke-dasharray: 9 5 2 5;
}
.dimension text,
.axis-letters text {
  fill: currentColor;
  font-size: 12px;
}
.ring-outline {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2;
}
.lap-lines polyline {
  stroke-width: 1;
  stroke-dasharray: 3 7;
  opacity: 0.48;
}
.lap-lines .current-lap {
  stroke-width: 1.8;
  stroke-dasharray: 6 4;
  opacity: 0.94;
}
.lap-lines .primary-path {
  stroke: var(--accent);
  stroke-dasharray: 2 5;
  opacity: 0.64;
}
.station line {
  stroke: var(--lap);
  stroke-width: 2;
}
.station circle {
  fill: var(--surface);
  stroke: var(--lap);
  stroke-width: 2;
}
.station text {
  fill: var(--ink);
  font-style: italic;
}
.gate-hit polyline {
  pointer-events: stroke;
  fill: none;
  stroke: transparent;
  stroke-width: 28;
  cursor: crosshair;
}
figcaption,
.lap-controls {
  position: absolute;
  left: clamp(4.6rem, 10vw, 11rem);
  animation: gate-ink-in 0.45s ease both;
}
figcaption {
  top: 16%;
  display: grid;
  gap: 0.35rem;
}
figcaption span {
  font: 600 clamp(1.1rem, 2vw, 1.9rem)/1.1 var(--font-display, inherit);
  color: var(--ink);
}
small {
  font-size: 0.74rem;
  color: var(--muted);
}
.lap-controls {
  bottom: 10%;
  left: auto;
  right: clamp(2.4rem, 7vw, 8rem);
  font-size: 0.84rem;
  pointer-events: auto;
  max-width: calc(100% - 5rem);
  font-variant-numeric: tabular-nums;
}
.lap-pick,
.measurements {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.lap-pick span {
  margin-right: 0.8rem;
  color: var(--ink);
}
.lap-pick button {
  width: 1.7rem;
  height: 2rem;
  display: grid;
  place-content: center;
}
.lap-pick button::before {
  content: '';
  width: 11px;
  height: 3px;
  background: var(--lap);
}
.lap-pick button[aria-pressed='true']::before {
  height: 9px;
  outline: 1px solid currentColor;
  outline-offset: 3px;
}
.measurements {
  gap: 0.5rem 1.2rem;
}
.measurements em {
  display: block;
  font-style: normal;
  font-size: 0.72rem;
}
.measurements b {
  color: var(--ink);
  font-weight: 600;
}
.time-key {
  color: var(--lap);
  margin-left: 1.2em;
}
input {
  display: block;
  width: 100%;
  height: 1.55rem;
  appearance: none;
  margin: 0.2rem 0;
  background: linear-gradient(var(--muted), var(--muted)) center / 100% 1px
    no-repeat;
  cursor: pointer;
}
input::-webkit-slider-thumb {
  appearance: none;
  width: 0.7rem;
  height: 0.7rem;
  border: 2px solid var(--lap);
  border-radius: 50%;
  background: var(--surface);
}
input::-moz-range-thumb {
  width: 0.5rem;
  height: 0.5rem;
  border: 2px solid var(--lap);
  border-radius: 50%;
  background: var(--surface);
}

@keyframes gate-ink-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (max-width: 600px) {
  figcaption {
    left: 3.9rem;
  }
  .lap-controls {
    right: 6%;
    bottom: 9%;
    width: max-content;
  }
  .measurements {
    gap: 0.5rem;
    font-size: 0.68rem;
  }
  .lap-pick button {
    width: 1.45rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .gate-sheet,
  figcaption,
  .lap-controls {
    animation: none;
    transition: none;
  }
}
</style>
