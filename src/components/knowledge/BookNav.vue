<script setup lang="ts">
import { usePageLanguage } from '../../lib/page-language';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Icon from '../ui/Icon.vue';
import { topics } from '../../data/topics';
import { pageUrl, t, type Locale } from '../../lib/i18n';
const input = defineProps<{ locale: Locale }>();
const locale = usePageLanguage(input.locale);
const expanded = ref(false);
const trigger = ref<HTMLAnchorElement>();
const menu = ref<HTMLElement>();
// Each trace ends in a plated via or a small component pad.
const traces = [
  { d: 'M-7 -20V-44L-29 -66H-73', x: -76, y: -66, kind: 'via' },
  { d: 'M-19 -15H-42L-64 -37H-96', x: -99, y: -37, kind: 'pad' },
  { d: 'M6 -21V-52L23 -69V-87', x: 23, y: -90, kind: 'via', faint: true },
  { d: 'M21 -13H47L66 -32H100', x: 103, y: -32, kind: 'chip', faint: true },
  { d: 'M22 1H49L66 18H113', x: 116, y: 18, kind: 'via' },
  { d: 'M21 10H41L67 36V53', x: 67, y: 56, kind: 'pad' },
  { d: 'M5 21V46L27 68H58', x: 61, y: 68, kind: 'via', faint: true },
  { d: 'M-21 12H-46L-65 31H-106', x: -109, y: 31, kind: 'chip', faint: true },
  { d: 'M-11 22V45L-30 64H-67', x: -70, y: 64, kind: 'via' },
];
const clocks = ref(traces.map((_, i) => ({ period: 4.5, delay: -i * 0.61 })));
onMounted(() => {
  clocks.value = traces.map(() => {
    const period = 3.6 + Math.random() * 2.3;
    return { period, delay: -Math.random() * period };
  });
});
let hoverTimer = 0;
onBeforeUnmount(() => clearTimeout(hoverTimer));
function close() {
  clearTimeout(hoverTimer);
  expanded.value = false;
}
function escape() {
  trigger.value?.focus();
  close();
}
function leave(event: FocusEvent) {
  if (!menu.value?.contains(event.relatedTarget as Node)) close();
}
function hover(event: PointerEvent) {
  clearTimeout(hoverTimer);
  if (event.pointerType === 'mouse')
    hoverTimer = window.setTimeout(() => (expanded.value = true), 115);
}
function focusBook() {
  if (trigger.value?.matches(':focus-visible')) expanded.value = true;
}
function cancelHover() {
  clearTimeout(hoverTimer);
}
function pointerLeave() {
  clearTimeout(hoverTimer);
  if (!menu.value?.contains(document.activeElement))
    hoverTimer = window.setTimeout(close, 460);
}
// The board is authored on a 270 x 208 grid and stretches vertically with the
// number of directions.
const board = { width: 270, height: 208, radiusX: 107, radiusY: 82 };
const height = Math.max(board.height, topics.length * 23);

// Socket positions for the nine current directions were placed by hand so the
// traces read like a real board. Any other count falls back to an even ring on
// the same ellipse: correct, but worth placing by hand once the count settles.
const authoredSockets: Record<
  number,
  readonly (readonly [x: number, y: number])[]
> = {
  9: [
    [58, 34],
    [209, 34],
    [242, 83],
    [245, 120],
    [195, 168],
    [113, 181],
    [47, 151],
    [28, 83],
    [135, 19],
  ],
};
const sockets =
  authoredSockets[topics.length] ??
  topics.map((_, i) => {
    const turn = (i / topics.length) * Math.PI * 2 - Math.PI / 2;
    return [
      board.width / 2 + Math.cos(turn) * board.radiusX,
      board.height / 2 + Math.sin(turn) * board.radiusY,
    ] as const;
  });

function port(i: number) {
  const [x, y] = sockets[i]!;
  return { x, y: (y * height) / board.height };
}
function trace(i: number) {
  const { x, y } = port(i);
  const cx = board.width / 2,
    cy = height / 2,
    dx = x - cx,
    dy = y - cy;
  // Sockets high above the chip leave from its top edge over a shoulder bend
  // instead of running straight out sideways.
  if (dy < -cy * 0.45) {
    const pin = cx + Math.sign(dx) * 13;
    const shoulder = cy - 37;
    return `M${pin} ${cy} V${shoulder} L${pin + Math.sign(dx) * 12} ${shoulder - 12} V${y} H${x}`;
  }
  const signX = Math.sign(dx) || 1,
    signY = Math.sign(dy) || 1;
  const bend = Math.min(14, Math.abs(dx) * 0.32 + 5);
  return Math.abs(dx) > Math.abs(dy)
    ? `M${cx} ${cy} h${dx * 0.34} l${signX * bend} ${signY * bend} H${x - signX * 14} V${y} H${x}`
    : `M${cx} ${cy} v${dy * 0.36} l${signX * bend} ${signY * bend} V${y - signY * 10} H${x} V${y}`;
}
</script>
<template>
  <nav
    ref="menu"
    class="book-nav"
    :aria-label="t(locale).knowledge"
    @keydown.esc.prevent="escape"
    @focusout="leave"
    @pointerenter="cancelHover"
    @pointerleave="pointerLeave"
  >
    <div
      class="core-cluster"
      :style="{ '--tree-height': height + 'px' }"
      :data-open="expanded"
    >
      <a
        ref="trigger"
        :href="pageUrl(locale, 'knowledge')"
        class="book-trigger"
        aria-controls="book-branches"
        :aria-expanded="expanded"
        :aria-label="t(locale).knowledge"
        @pointerenter="hover"
        @focus="focusBook"
      >
        <svg
          class="pcb-island"
          viewBox="-158 -104 316 208"
          fill="none"
          aria-hidden="true"
        >
          <g v-for="(trace, i) in traces" :key="trace.d">
            <path
              :d="trace.d"
              class="pcb-route"
              :class="{ 'pcb-faint': trace.faint }"
            />
            <path
              :d="trace.d"
              pathLength="100"
              class="pcb-current"
              :style="{
                '--pulse-period': clocks[i].period + 's',
                '--pulse-delay': clocks[i].delay + 's',
              }"
            />
            <g
              :transform="`translate(${trace.x} ${trace.y})`"
              class="pcb-terminal"
              :class="{ 'pcb-faint': trace.faint }"
            >
              <circle v-if="trace.kind === 'via'" r="2.6" />
              <g v-else-if="trace.kind === 'chip'">
                <rect x="-4" y="-4" width="8" height="8" rx="1" />
                <path
                  d="M-2 -4v-2m4 2v-2m-4 10v2m4-2v2M-4 -2h-2m2 4h-2m10-4h2m-2 4h2"
                />
              </g>
              <rect v-else x="-3.5" y="-1.9" width="7" height="3.8" rx=".6" />
            </g>
          </g>
        </svg>
        <span class="book-chip"><Icon name="book" /></span>
      </a>
      <Transition name="branch-fade"
        ><div
          id="book-branches"
          v-show="expanded"
          :inert="!expanded"
          class="core-branches"
        >
          <svg
            class="core-copper"
            :viewBox="`0 0 ${board.width} ${height}`"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g
              v-for="(topic, i) in topics"
              :key="topic.id"
              :style="{ '--delay': i * 23 + 'ms' }"
            >
              <path :d="trace(i)" pathLength="1" />
              <path
                class="trace-rail"
                :d="trace(i)"
                :transform="'translate(' + (i % 2 ? 2 : -2) + ' 2)'"
                pathLength="1"
              />
              <path class="trace-current" :d="trace(i)" pathLength="1" />
              <circle :cx="port(i).x" :cy="port(i).y" r="4" />
            </g>
          </svg>
          <a
            v-for="(topic, i) in topics"
            :key="topic.id"
            class="core-port"
            :class="{ 'label-below': port(i).y >= height / 2 }"
            :href="pageUrl(locale, 'knowledge/' + topic.id)"
            :aria-label="topic.title[locale]"
            :style="{
              '--x': (port(i).x / board.width) * 100 + '%',
              '--y': (port(i).y / height) * 100 + '%',
              '--delay': i * 23 + 'ms',
            }"
            ><Icon :name="topic.icon" /><span>{{
              topic.title[locale]
            }}</span></a
          >
        </div></Transition
      >
    </div>
  </nav>
</template>

<style scoped>
.pcb-island {
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(18rem, 36vw, 40rem);
  height: auto;
  max-width: none;
  overflow: visible;
  transform: translate(-50%, -50%);
  color: var(--muted);
  opacity: 0.44;
  transition: opacity 0.35s;
}
.pcb-route,
.pcb-terminal {
  stroke: currentColor;
  stroke-width: 0.65;
  opacity: 0.36;
}
.pcb-terminal {
  fill: var(--surface);
}
.pcb-faint {
  opacity: 0.22;
}
.pcb-current {
  visibility: hidden;
}
:global(
  [data-airborne]:not([data-left-floor])
    .hero-shot:has(.season-air[data-awake])
    [data-open='false']
    .pcb-current
) {
  visibility: visible;
  animation-play-state: running;
}
[data-open='true'] .pcb-island {
  opacity: 0.13;
}
@media (max-width: 840px), (max-height: 379px) {
  .pcb-island {
    width: clamp(10rem, 53vw, 16rem);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pcb-current {
    display: none;
  }
}
</style>
