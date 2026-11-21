<script setup lang="ts">
import { usePageLanguage } from '../../lib/page-language';
import { onBeforeUnmount, ref } from 'vue';
import Icon from '../ui/Icon.vue';
import { topics } from '../../data/topics';
import { pageUrl, t, type Locale } from '../../lib/i18n';
const input = defineProps<{ locale: Locale }>();
const locale = usePageLanguage(input.locale);
const expanded = ref(false);
const trigger = ref<HTMLAnchorElement>();
const menu = ref<HTMLElement>();
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
const height = Math.max(208, topics.length * 23);
function port(i: number) {
  const sockets = [
    [58, 34],
    [209, 34],
    [242, 83],
    [245, 120],
    [195, 168],
    [113, 181],
    [47, 151],
    [28, 83],
    [135, 19],
  ];
  const [x, y] = sockets[i];
  return { x, y: (y * height) / 208 };
}
function trace(i: number) {
  const { x, y } = port(i);
  const cx = 135,
    cy = height / 2,
    dx = x - cx,
    dy = y - cy;
  if ([0, 1, 8].includes(i)) {
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
          <g class="pcb-etching">
            <path
              d="M17 -23V-42L30-55H43L60-72V-85L76-101H84
                 M23 -23V-34L39-50H61L78-67H91
                 M23 -18H35L48-31H85L101-47H121
                 M-20 23V34L-44 58H-62L-78 74H-95
                 M-24 18H-40L-55 33H-73L-101 61H-120
                 M-53 20H-70L-87 37H-121
                 M128 -112H142L150-104H161
                 M143 -77H151L161-67H176"
            />
            <circle cx="87" cy="-101" r="2.2" />
            <circle cx="94" cy="-67" r="2" />
            <circle cx="124" cy="-47" r="2.2" />
            <circle cx="179" cy="-67" r="2.1" />
            <circle cx="-98" cy="74" r="2.4" />
            <circle cx="-123" cy="61" r="2.2" />
            <g transform="translate(112 -119)">
              <rect x="-8" y="-8" width="16" height="16" rx="1.3" />
              <rect x="-4.3" y="-4.3" width="8.6" height="8.6" rx=".8" />
              <path
                d="M-5 -8v-3m5 3v-3m5 3v-3M-5 8v3m5-3v3m5-3v3M-8-4h-3m3 4h-3m3 4h-3m19-8h3m-3 4h3m-3 4h3"
              />
              <circle cx="-6" cy="-6" r=".6" fill="currentColor" />
            </g>
            <g transform="translate(176 -95)">
              <rect x="-5" y="-5" width="10" height="10" rx=".9" />
              <path d="M-5-3h-3m3 3h-3m3 3h-3m13-6h3m-3 3h3m-3 3h3" />
              <circle r="1.7" />
            </g>
            <g transform="translate(130 -78)">
              <path d="M0-7 10-2 0 3-10-2ZM-10 1 0 6 10 1m-20 3 10 5 10-5" />
              <path d="M-4-2 0-4 4-2 0 0Z" />
            </g>
            <g transform="translate(-131 37)">
              <rect x="-7" y="-5.5" width="14" height="11" rx="1" />
              <path
                d="M-7-3h-3m3 3h-3m3 3h-3m17-6h3m-3 3h3m-3 3h3M-3-2h6v4h-6z"
              />
            </g>
          </g>
          <g
            v-for="side in ['upper', 'compact-tail']"
            :key="side"
            :class="'pcb-' + side"
            :transform="side === 'upper' ? 'rotate(20) scale(-1)' : undefined"
          >
            <path
              class="pcb-route"
              d="M24 -7H42L67 18H89L127 56H143
                 M24 0H38L65 27H84L126 69H137
                 M24 7H34L62 35H77L116 74
                 M24 14H29L55 40H68L99 71H107
                 M12 23V35L32 55V61L54 83H73
                 M5 23V38L25 58V65L50 90H59"
            />
            <g class="pcb-via">
              <circle cx="146" cy="56" r="2.7" />
              <circle cx="119" cy="77" r="2.1" />
              <circle cx="110" cy="71" r="2.5" />
              <circle cx="76" cy="83" r="2.6" />
            </g>
            <g transform="translate(142 69)">
              <rect
                x="-5"
                y="-2.7"
                width="10"
                height="5.4"
                rx=".8"
                class="pcb-pad"
              />
              <path d="M-2.5 -2.7h5v5.4h-5z" class="pcb-body" />
            </g>
            <g v-if="side === 'compact-tail'">
              <g
                v-for="x in [64, 71, 78]"
                :key="x"
                :transform="`translate(${x} 65)`"
              >
                <rect
                  x="-2.2"
                  y="-5"
                  width="4.4"
                  height="10"
                  rx=".7"
                  class="pcb-pad"
                />
                <rect
                  x="-2.2"
                  y="-2.7"
                  width="4.4"
                  height="5.4"
                  rx=".5"
                  class="pcb-body"
                />
              </g>
              <path class="pcb-silk" d="M60 60v-3h22v3 M60 70v3h20" />
            </g>
          </g>
          <g class="pcb-wide-tail">
            <path
              class="pcb-route"
              d="M24 -7H43L61 11H105L127 33H159L174 18H210
                 M24 0H39L62 23H96L121 48H151L169 30H188
                 M24 7H35L62 34H85L112 61H144L164 81H203
                 M24 14H29L57 42H74L98 66H112L132 86H166
                 M12 23V38L34 60H49L71 82H100
                 M5 23V40L31 66V71L54 94H83"
            />
            <path
              class="pcb-route pcb-spur"
              d="M151 48L166 63H174 M177 81L186 90H194"
            />
            <g class="pcb-via">
              <circle cx="213" cy="18" r="2.7" />
              <circle cx="206" cy="81" r="2.4" />
              <circle cx="169" cy="86" r="2.3" />
              <circle cx="103" cy="82" r="2.6" />
              <circle cx="197" cy="90" r="2.1" class="pcb-spur" />
            </g>
            <g transform="translate(193 30)">
              <rect
                x="-5"
                y="-2.7"
                width="10"
                height="5.4"
                rx=".8"
                class="pcb-pad"
              />
              <path d="M-2.5 -2.7h5v5.4h-5z" class="pcb-body" />
            </g>
            <g
              v-for="x in [178, 186, 194]"
              :key="x"
              :transform="`translate(${x} 63)`"
            >
              <rect
                x="-2.2"
                y="-5"
                width="4.4"
                height="10"
                rx=".7"
                class="pcb-pad"
              />
              <rect
                x="-2.2"
                y="-2.7"
                width="4.4"
                height="5.4"
                rx=".5"
                class="pcb-body"
              />
            </g>
            <path class="pcb-silk" d="M173 59V55H199V59 M173 68V71H199V68" />
          </g>
          <path class="pcb-route pcb-spur" d="M-11 23V39L-24 52H-37" />
          <circle cx="-40" cy="52" r="2.4" class="pcb-via pcb-spur" />
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
            :viewBox="'0 0 270 ' + height"
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
              '--x': (port(i).x / 270) * 100 + '%',
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
  width: clamp(16rem, 38vw, 44rem);
  height: auto;
  max-width: none;
  overflow: visible;
  transform: translate(-50%, -50%);
  color: var(--muted);
  opacity: 0.44;
  transition: opacity 0.35s;
}
.pcb-compact-tail {
  display: none;
}
.pcb-etching {
  color: color-mix(in srgb, var(--muted) 75%, var(--surface));
  stroke: currentColor;
  stroke-width: 0.43;
  opacity: 0.48;
}
.pcb-route,
.pcb-silk {
  stroke: currentColor;
  stroke-width: 0.65;
  opacity: 0.65;
}
.pcb-silk {
  opacity: 0.42;
}
.pcb-pad {
  fill: color-mix(in srgb, var(--ink) 55%, var(--surface));
}
.pcb-body {
  fill: var(--surface);
  stroke: currentColor;
  stroke-width: 0.6;
}
.pcb-via {
  stroke: color-mix(in srgb, var(--accent) 60%, var(--muted));
  stroke-width: 0.8;
}
.pcb-spur {
  opacity: 0.45;
}
[data-open='true'] .pcb-island {
  opacity: 0.13;
}
@media (max-width: 840px), (max-height: 509px) {
  .pcb-island {
    width: clamp(8rem, 43vw, 14rem);
  }
  .pcb-etching,
  .pcb-wide-tail {
    display: none;
  }
  .pcb-compact-tail {
    display: inline;
  }
}
</style>
