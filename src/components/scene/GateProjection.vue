<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import {
  gateApproach,
  gateExitStart,
  gateExitEnd,
  gateParked,
  gatePoint,
  gateYaw,
} from '../../data/flight-path';
import {
  laps,
  bendWeight,
  type LapBend,
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
const light = ref(false);
const lapColors = computed(() =>
  laps.map((lap) => (light.value ? lap.lightColor : lap.color)),
);
const studying = ref(false);
const size = ref({ x: 1280, y: 800 });
const selected = ref(0);
const bends = ref<LapBend[]>(laps.map(() => [0, 0]));
const story = () => surface.value?.closest<HTMLElement>('[data-story]');
function commitBend(index: number) {
  story()?.dispatchEvent(
    new CustomEvent('gate-reshape', {
      detail: { index, bend: [...bends.value[index]] },
    }),
  );
}
const step = ref(75);
const progress = ref(-1);
const elapsed = ref(0);
const survey = ref(0);
const primary = computed(
  () =>
    live.value &&
    progress.value >= 0 &&
    progress.value < gateParked &&
    elapsed.value === 0,
);
function ramp(x: number, from: number, to: number) {
  const a = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return a * a * (3 - 2 * a);
}
const quantities = computed(() =>
  !live.value
    ? 1
    : ramp(progress.value, 0.78, 0.84) *
      (1 - ramp(progress.value, gateExitStart, gateExitEnd)),
);
const drawing = computed(() =>
  !live.value
    ? 1
    : ramp(
        progress.value,
        elapsed.value > 0 ? 0.92 : gateParked - 0.003,
        gateParked,
      ) *
      (1 - ramp(progress.value, gateExitStart, gateExitEnd)),
);
const formulas = computed(() =>
  live.value ? ramp(progress.value, 0.845, 0.89) : 1,
);
const measurements = computed(() =>
  live.value ? ramp(progress.value, 0.9, 0.95) : 1,
);
const grid = computed(() =>
  !live.value || studying.value ? 1 : ramp(elapsed.value, 0.35, 2.1),
);
let resize: ResizeObserver | undefined;
let state: MutationObserver | undefined;

onMounted(() => {
  const story = surface.value!.closest<HTMLElement>('[data-story]')!;
  stage.value = story.querySelector<HTMLElement>('.scene-stage')!;
  let needsStudyStation = false;
  const update = () => {
    light.value = document.documentElement.dataset.theme === 'light';
    const enteringLive = !live.value && !!story.dataset.live;
    live.value = !!story.dataset.live;
    if (enteringLive)
      bends.value.forEach((bend, index) => {
        if (bend.some(Boolean)) commitBend(index);
      });
    const [p, seconds, index, age, reveal] = (
      story.dataset.gateSample || '-1,0,0,0,0'
    )
      .split(',')
      .map(Number);
    progress.value = p;
    elapsed.value = seconds;
    survey.value = live.value ? reveal : 1;
    const phase = story.dataset.gatePhase;
    studying.value = !live.value || phase === 'study';
    if (!studying.value) finishDrag();
    if (live.value && phase === 'replays') {
      // Follow one airborne aircraft through its pass, then pick up the next.
      selected.value = index;
      step.value = Math.round(120 * Math.min(1, age / laps[index].duration));
      needsStudyStation = true;
    } else if (studying.value && needsStudyStation) {
      step.value = 75;
      needsStudyStation = false;
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
    attributeFilter: ['data-live', 'data-gate-phase', 'data-gate-sample'],
  });
  state.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
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
    sampleLap(i, width.value, bends.value[i]).map((station) => ({
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
          bends.value[selected.value],
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
  Array.from({ length: 121 }, (_, i) => {
    const progress = gateApproach + ((gateParked - gateApproach) * i) / 120;
    const [x, y] = gatePoint(progress, width.value);
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
  const a = lapPoint(i, lo, width.value, bends.value[i]),
    b = lapPoint(i, hi, width.value, bends.value[i]);
  const dt = (hi - lo) * laps[i].duration;
  const [x, y, z] = a.map((value, axis) => (b[axis] - value) / dt);
  return { x, y, speed: Math.hypot(x, y, z) };
});
// All three components and the path length use the same centreline diameter.
const displacement = computed(() => {
  const from = primary.value
    ? gatePoint(gateApproach, width.value)
    : tracks.value[selected.value][0].point;
  const to = primary.value
    ? gatePoint(progress.value, width.value)
    : active.value.point;
  const unit = primary.value ? ringDiameter(width.value) : 1;
  return to.map((v, i) => (v - from[i]) / unit);
});
const distance = computed(() => Math.hypot(...displacement.value));
const directness = computed(() => {
  if (!primary.value)
    return active.value.length ? distance.value / active.value.length : 0;
  const end = progress.value;
  let previous = gatePoint(gateApproach, width.value);
  let length = 0;
  for (let i = 1; i <= 32; i++) {
    const point = gatePoint(
      gateApproach + ((end - gateApproach) * i) / 32,
      width.value,
    );
    length += Math.hypot(...point.map((v, axis) => v - previous[axis]));
    previous = point;
  }
  return length ? (distance.value * ringDiameter(width.value)) / length : 0;
});
const arrow = computed(() => {
  const track = tracks.value[selected.value];
  // Follow the plotted stations over the next interval, including tight bends.
  const end = Math.min(120, step.value + 5);
  const points = track.slice(Math.max(0, end - 5), end + 1);
  return {
    points: points.map(({ x, y }) => `${x},${y}`).join(' '),
    tip: track[end],
  };
});
const numberFormat = computed(
  () =>
    new Intl.NumberFormat(uk.value ? 'uk-UA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
);
const fmt = (value: number) => numberFormat.value.format(value);
const time = computed(
  () => active.value.fraction * laps[selected.value].duration,
);
const drag = ref<{
  id: number;
  lap: number;
  side: 0 | 1;
  startY: number;
  startBend: number;
  weight: number;
}>();
function updateBend(lap: number, side: 0 | 1, value: number) {
  const bend: [number, number] = [...bends.value[lap]];
  bend[side] = Math.max(-0.64, Math.min(0.64, value));
  bends.value[lap] = bend;
}
function probe(event: PointerEvent) {
  if (!studying.value || !(event.currentTarget instanceof SVGElement)) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) * size.value.x) / rect.width;
  const y = ((event.clientY - rect.top) * size.value.y) / rect.height;
  if (drag.value) {
    const d = drag.value;
    if (event.pointerId === d.id)
      updateBend(
        d.lap,
        d.side,
        d.startBend +
          ((d.startY - event.clientY) * size.value.y) /
            (rect.height * scale.value * d.weight),
      );
    return;
  }
  let best = 24;
  let lap = selected.value,
    station = step.value;
  for (const [i, track] of tracks.value.entries()) {
    for (let j = 1; j < track.length; j++) {
      const a = track[j - 1],
        b = track[j],
        dx = b.x - a.x,
        dy = b.y - a.y;
      const u = Math.max(
        0,
        Math.min(
          1,
          ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
      const distance =
        Math.hypot(a.x + u * dx - x, a.y + u * dy - y) -
        (i === selected.value ? 2.5 : 0);
      if (distance < best) {
        best = distance;
        lap = i;
        station = u < 0.5 ? j - 1 : j;
      }
    }
  }
  selected.value = lap;
  step.value = station;
}
function startDrag(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0 || !studying.value || drag.value)
    return;
  probe(event);
  const side = step.value < 60 ? 0 : 1;
  const weight = bendWeight(step.value / 120);
  if (weight < 0.045) return;
  drag.value = {
    id: event.pointerId,
    lap: selected.value,
    side,
    startY: event.clientY,
    startBend: bends.value[selected.value][side],
    weight,
  };
  (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
}
function finishDrag() {
  const activeDrag = drag.value;
  if (!activeDrag) return;
  drag.value = undefined;
  if (bends.value[activeDrag.lap][activeDrag.side] !== activeDrag.startBend)
    commitBend(activeDrag.lap);
}
function endDrag(event: PointerEvent) {
  if (drag.value?.id === event.pointerId) finishDrag();
}
function nudge(amount: number) {
  const side = step.value < 60 ? 0 : 1;
  updateBend(selected.value, side, bends.value[selected.value][side] + amount);
  commitBend(selected.value);
}
</script>

<template>
  <figure
    ref="surface"
    class="gate-study"
    :class="{ 'is-live': live, 'is-ready': studying }"
    :inert="quantities === 0"
    :style="{ '--readouts': quantities }"
    :aria-label="uk ? 'Кінематика прольоту' : 'Flight kinematics'"
  >
    <Teleport :to="stage || 'body'" :disabled="!stage || !live">
      <svg
        class="gate-sheet"
        :class="{ 'is-ready': drawing > 0, 'is-day': light }"
        :style="{ '--drawing': drawing, '--grid': grid }"
        :viewBox="`0 0 ${size.x} ${size.y}`"
        aria-hidden="true"
      >
        <!-- The orthographic view looks at a yawed hoop. The incoming (right)
             half lies in front of its rim, the outgoing half behind it. Share
             the ink so dash phase, ticks and the scrub marker survive the split. -->
        <defs>
          <clipPath id="gate-back">
            <rect x="0" y="0" :width="origin.x" :height="size.y" />
          </clipPath>
          <clipPath id="gate-front">
            <rect
              :x="origin.x"
              y="0"
              :width="size.x - origin.x"
              :height="size.y"
            />
          </clipPath>
          <g id="gate-tracks">
            <g class="lap-lines" fill="none">
              <g :opacity="survey" class="survey-lines">
                <polyline
                  v-for="(points, i) in paths"
                  :key="i"
                  :points="points"
                  :stroke="lapColors[i]"
                  class="survey-line"
                  :class="{ 'current-lap': i === selected, 'is-day': light }"
                />
              </g>
              <polyline :points="primaryPath" class="primary-path" />
            </g>
            <g
              :fill="lapColors[selected]"
              :opacity="studying ? 0.8 : 0"
              class="survey-detail"
            >
              <circle
                v-for="(tick, i) in ticks"
                :key="i"
                :cx="tick.x"
                :cy="tick.y"
                r="2.7"
              />
            </g>
            <g
              :opacity="studying ? 1 : 0"
              :style="{ '--lap': lapColors[selected] }"
              class="station survey-detail"
            >
              <polyline
                fill="none"
                :points="arrow.points"
                marker-end="url(#velocity-tip)"
              />
              <circle :cx="active.x" :cy="active.y" r="5" />
              <text :x="arrow.tip.x" :y="arrow.tip.y - 9">t</text>
            </g>
          </g>
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
        <rect
          class="graph-paper"
          width="100%"
          height="100%"
          fill="url(#gate-minor)"
        />
        <rect
          class="graph-paper"
          width="100%"
          height="100%"
          fill="url(#gate-major)"
        />
        <path
          :style="{ transformOrigin: origin.x + 'px ' + origin.y + 'px' }"
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
        <use href="#gate-tracks" clip-path="url(#gate-back)" />
        <g
          :transform="`translate(${origin.x + scale * 0.49},${origin.y})`"
          class="dimension graph-paper"
        >
          <path :d="`M0 ${-scale / 2}v${scale}m-4 0h8M-4 ${-scale / 2}h8`" />
          <text x="8" y="-7">D</text>
        </g>
        <path
          v-if="!live"
          class="ring-outline"
          :d="`M ${origin.x} ${origin.y - scale / 2} a ${(scale / 2) * Math.cos(gateYaw)} ${scale / 2} 0 0 0 0 ${scale}`"
        />
      </svg>
      <svg
        class="gate-foreground"
        :style="{ opacity: drawing }"
        :viewBox="`0 0 ${size.x} ${size.y}`"
        aria-hidden="true"
      >
        <use href="#gate-tracks" clip-path="url(#gate-front)" />
      </svg>
    </Teleport>
    <template v-if="quantities > 0">
      <svg
        v-if="studying"
        class="gate-hit"
        :viewBox="`0 0 ${size.x} ${size.y}`"
        aria-hidden="true"
        @pointermove="probe"
        @pointerdown="startDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @lostpointercapture="endDrag"
        :class="{ 'is-dragging': drag }"
      >
        <polyline v-for="(points, i) in paths" :key="i" :points="points" />
      </svg>
      <figcaption>
        <h2>{{ uk ? 'Кінематика прольоту' : 'Flight kinematics' }}</h2>
        <small>{{ uk ? 'D — діаметр кільця' : 'D = gate diameter' }}</small>
        <div class="equation">
          <small>{{
            uk ? 'Переміщення від старту' : 'Displacement from launch'
          }}</small>
          <div>‖Δr‖ = √(Δx² + Δy² + Δz²)</div>
          <div class="substitution">
            √({{
              displacement
                .map((value) => fmt(Math.abs(value)) + '²')
                .join(' + ')
            }}) D
          </div>
          <strong>≈ {{ fmt(distance) }} D</strong>
        </div>
      </figcaption>
      <div class="derived vertical-speed" :style="{ opacity: formulas }">
        <small>{{
          primary
            ? uk
              ? 'Зміна висоти'
              : 'Height change'
            : uk
              ? 'Вертикальна швидкість'
              : 'Vertical velocity'
        }}</small>
        <span v-if="primary">Δy = {{ fmt(displacement[1]) }} D</span>
        <span v-else
          >vᵧ = dy/dt ≈ {{ fmt(velocity.y) }} D/{{ uk ? 'с' : 's' }}</span
        >
      </div>
      <div class="derived directness" :style="{ opacity: formulas }">
        <small>{{
          uk ? 'Переміщення / шлях' : 'Displacement / distance'
        }}</small>
        <span>‖Δr‖ / s ≈ {{ directness ? fmt(directness) : '—' }}</span>
      </div>
      <div
        class="lap-controls"
        :inert="measurements === 0"
        :style="{ '--lap': lapColors[selected], opacity: measurements }"
      >
        <div
          v-if="!primary"
          class="lap-pick"
          role="group"
          :aria-label="uk ? 'Попередні прольоти' : 'Previous passes'"
        >
          <span class="lap-label">
            {{ uk ? 'Проліт' : 'Pass' }}
            <span class="lap-number">
              <Transition name="lap-number">
                <span :key="selected">{{
                  String(selected + 1).padStart(2, '0')
                }}</span>
              </Transition>
            </span>
          </span>
          <div class="lap-swatches" :style="{ '--lap-index': selected }">
            <span class="lap-ring" aria-hidden="true"></span>
            <template v-for="(lap, i) in laps" :key="lap.color">
              <button
                v-if="studying"
                type="button"
                class="lap-swatch"
                :style="{ '--swatch': lapColors[i] }"
                :class="{ 'is-current': i === selected }"
                :aria-pressed="i === selected"
                :aria-label="(uk ? 'Проліт ' : 'Pass ') + (i + 1)"
                @click="selected = i"
              ></button>
              <span
                v-else
                class="lap-swatch"
                :style="{ '--swatch': lapColors[i] }"
                :class="{ 'is-current': i === selected }"
                aria-hidden="true"
              ></span>
            </template>
          </div>
        </div>
        <div v-if="primary" class="measurements">
          <span v-for="(v, i) in displacement" :key="i"
            ><em>Δ{{ ['x', 'y', 'z'][i] }}</em
            ><b>{{ fmt(v) }}</b> D</span
          >
        </div>
        <div v-else class="measurements">
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
        <div v-if="!primary" class="lap-tools">
          <input
            v-if="studying"
            type="range"
            min="0"
            max="120"
            v-model.number="step"
            :aria-label="uk ? 'Час від початку прольоту' : 'Time since launch'"
            :aria-valuetext="fmt(time) + (uk ? ' с' : ' s')"
          />
          <small class="mean-speed"
            >{{ uk ? 'Середня швидкість' : 'Mean speed' }} · s/t =
            {{ time > 0 ? fmt(active.length / time) : '—' }} D/{{
              uk ? 'с' : 's'
            }}</small
          >
          <div class="bend-controls" v-if="studying">
            <small>{{ uk ? 'Вигин' : 'Bend' }}</small>
            <button
              @click="nudge(-0.1)"
              :aria-label="uk ? 'Опустити ділянку' : 'Lower this segment'"
            >
              −
            </button>
            <button
              @click="nudge(0.1)"
              :aria-label="uk ? 'Підняти ділянку' : 'Raise this segment'"
            >
              +
            </button>
            <button
              v-if="bends[selected].some(Boolean)"
              @click="
                bends[selected] = [0, 0];
                commitBend(selected);
              "
              :aria-label="uk ? 'Відновити траєкторію' : 'Reset this path'"
            >
              ↺
            </button>
          </div>
          <small v-if="studying" class="time-legend"
            >v = ds/dt <span class="time-key">●</span>
            {{ uk ? 'кожні 0,25 с' : 'every 0.25 s' }}</small
          >
        </div>
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
  font: 500 0.825rem/1.4 var(--font-mono);
}
.gate-sheet {
  z-index: 1;
  opacity: 0;
  visibility: hidden;
}
.gate-sheet.is-ready {
  visibility: visible;
  opacity: var(--drawing, 1);
}
.gate-sheet .datum,
.dimension path {
  stroke: currentColor;
  fill: none;
  stroke-width: 1;
  opacity: 0.52;
}
.graph-paper {
  opacity: var(--grid, 1);
  transition: opacity 0.5s;
}
.survey-lines {
  transition: opacity 0.16s linear;
}
.survey-detail {
  transition: opacity 0.3s ease;
}
.gate-study {
  opacity: var(--readouts, 1);
  transition: opacity 0.25s;
}
.equation {
  margin-top: clamp(0.4rem, 1.8vh, 1.3rem);
  font-variant-numeric: tabular-nums;
}
.equation div {
  margin: 0.25em 0;
  color: var(--ink);
}
.equation .substitution {
  color: var(--muted);
  font-size: 0.84em;
}
.equation strong {
  font-weight: 500;
  color: var(--accent);
}
.mean-speed {
  display: block;
  margin: 0.4em 0;
}
.gate-sheet .datum {
  transform: scale(0);
  transition: transform 0.85s cubic-bezier(0.2, 0.7, 0.24, 1);
}
.gate-sheet.is-ready .datum {
  transform: scale(1);
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
.survey-line {
  stroke-width: 1;
  stroke-dasharray: 3 7;
  opacity: 0.48;
  transition:
    stroke-width 0.22s,
    opacity 0.22s;
}
.survey-line.current-lap {
  stroke-width: 1.8;
  stroke-dasharray: 6 4;
  opacity: 0.94;
}
.survey-line.is-day {
  stroke-width: 1.35;
  stroke-dasharray: 4.5 5.5;
  opacity: 0.82;
}
.survey-line.is-day.current-lap {
  stroke-width: 1.95;
  stroke-dasharray: 6 4;
  opacity: 0.98;
}
.lap-lines .primary-path {
  color: var(--accent);
  color: oklch(from var(--accent) l calc(c * 1.35) h);
  stroke: currentColor;
  stroke-width: 2.35;
  stroke-linecap: round;
  stroke-dasharray: 6 5;
  filter: drop-shadow(
    0 0 3px color-mix(in srgb, currentColor 55%, transparent)
  );
  opacity: 0.97;
}
.gate-sheet.is-day .lap-lines .primary-path {
  color: var(--accent);
  color: oklch(from var(--accent) min(0.61, calc(l + 0.095)) calc(c * 1.32) h);
}
.station polyline {
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
  touch-action: none;
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
  animation: gate-ink-in 0.32s ease;
}
figcaption {
  top: 16%;
  display: grid;
  gap: 0.35rem;
}
figcaption h2 {
  font: 600 clamp(1.21rem, 2.2vw, 2.09rem)/1.1 var(--font-mono);
  color: var(--ink);
}
small {
  font-size: 0.814rem;
  color: var(--muted);
}
.lap-controls {
  bottom: 10%;
  left: auto;
  right: clamp(2.4rem, 7vw, 8rem);
  font-size: 0.924rem;
  pointer-events: auto;
  width: min(19.25rem, calc(100% - 5rem));
  font-variant-numeric: tabular-nums;
}
.lap-pick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}
.lap-label {
  color: var(--ink);
  white-space: nowrap;
}
.lap-number {
  display: inline-grid;
  width: 2ch;
  color: var(--lap);
  transition: color 0.26s;
}
.lap-number > span {
  grid-area: 1 / 1;
}
.lap-number-enter-active,
.lap-number-leave-active {
  transition: opacity 0.22s;
}
.lap-number-enter-from,
.lap-number-leave-to {
  opacity: 0;
}
.lap-swatches {
  --swatch-slot: 1.7rem;
  position: relative;
  display: flex;
}
.lap-swatch,
.lap-ring {
  width: var(--swatch-slot);
  height: 2rem;
  display: grid;
  place-items: center;
}
button.lap-swatch {
  cursor: pointer;
}
.lap-swatch::before {
  content: '';
  width: 11px;
  height: 3px;
  background: var(--swatch);
  transition:
    transform 0.25s,
    background-color 0.25s,
    box-shadow 0.25s;
}
.lap-swatch.is-current::before {
  transform: scaleY(2.55);
}
button.lap-swatch:is(:hover, :focus-visible)::before {
  box-shadow: 0 0 7px var(--swatch);
}
.lap-ring {
  position: absolute;
  inset: 0 auto auto 0;
  pointer-events: none;
  transform: translateX(calc(var(--lap-index) * 100%));
  transition: transform 0.32s cubic-bezier(0.24, 0.72, 0.29, 1);
}
.lap-ring::before {
  content: '';
  width: 1.18rem;
  height: 1.08rem;
  border: 1px solid var(--lap);
  transition: border-color 0.3s;
}
.measurements {
  display: grid;
  grid-template-columns: 0.86fr 0.95fr 1.19fr;
  column-gap: 0.5rem;
  white-space: nowrap;
}
.lap-tools {
  display: grid;
  grid-template-rows: 1.9rem auto 1.8rem 1.1rem;
}
.lap-tools input {
  grid-row: 1;
}
.lap-tools .mean-speed {
  grid-row: 2;
}
.lap-tools .bend-controls {
  grid-row: 3;
}
.lap-tools .time-legend {
  grid-row: 4;
}
.measurements em {
  display: block;
  font-style: normal;
  font-size: 0.792rem;
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

.gate-foreground {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
  transition: opacity 0.55s;
}
.gate-hit.is-dragging,
.gate-hit.is-dragging polyline {
  cursor: grabbing;
}
.derived {
  position: absolute;
  display: grid;
  gap: 0.25rem;
  font-variant-numeric: tabular-nums;
}
.derived span {
  color: var(--ink);
}
.vertical-speed {
  left: 48%;
  top: 9%;
}
.directness {
  left: 42%;
  bottom: 8%;
}
.bend-controls {
  display: flex;
  align-items: center;
  gap: 0.35em;
}
.bend-controls button {
  width: 1.8rem;
  height: 1.8rem;
  cursor: pointer;
  color: var(--ink);
}
.bend-controls button:is(:hover, :focus-visible) {
  color: var(--accent);
}
@media (max-width: 840px), (max-height: 560px) {
  .derived {
    position: static;
    font-size: 0.68rem;
  }
  .gate-study {
    display: grid;
    grid-template-rows: auto auto 1fr auto auto;
    row-gap: 0.6rem;
    padding: clamp(1rem, 6vh, 4rem) 6% clamp(2.8rem, 6vh, 4rem)
      clamp(3.9rem, 10vw, 8rem);
    box-sizing: border-box;
  }
  figcaption,
  .lap-controls {
    position: static;
  }
  figcaption {
    grid-row: 1;
  }
  .vertical-speed {
    grid-row: 2;
  }
  .lap-controls {
    grid-row: 4;
    justify-self: end;
    width: min(19.25rem, 100%);
  }
  .directness {
    grid-row: 5;
    justify-self: end;
  }
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
  }
  .measurements {
    gap: 0.5rem;
    font-size: 0.68rem;
  }
  .lap-swatches {
    --swatch-slot: clamp(1.35rem, 6.8vw, 1.65rem);
  }
}
@media (prefers-reduced-motion: reduce) {
  .gate-sheet,
  .gate-sheet .datum,
  .graph-paper,
  .survey-lines,
  .survey-detail,
  figcaption,
  .lap-controls {
    animation: none;
    transition: none;
  }
}
</style>
