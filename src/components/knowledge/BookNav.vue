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
          viewBox="-108 -58 216 116"
          fill="none"
          aria-hidden="true"
        >
          <g
            v-for="mirror in [1, -1]"
            :key="mirror"
            :transform="`scale(${mirror} ${mirror})`"
          >
            <path
              class="pcb-route"
              d="M15 -13H36L44 -21H62 M15 -9H38L47 -17H57 M15 4H52L59 11H83 M6 -17V-29L14 -37H34 M19 14H38L52 28H70"
            />
            <g
              v-for="x in [46, 54, 62]"
              :key="x"
              :transform="`translate(${x} -26)`"
            >
              <rect
                x="-2.4"
                y="-5.8"
                width="4.8"
                height="12"
                rx=".8"
                class="pcb-pad"
              />
              <rect
                x="-2.6"
                y="-3.2"
                width="5.2"
                height="6.4"
                rx=".6"
                class="pcb-body"
              />
            </g>
            <rect x="71" y="21" width="12" height="8" rx="1" class="pcb-pad" />
            <rect x="74" y="21" width="6" height="8" class="pcb-body" />
            <circle cx="87" cy="11" r="2.8" class="pcb-via" />
            <circle cx="36" cy="-37" r="1.8" class="pcb-via" />
            <path class="pcb-silk" d="M42 -34h24v3 M69 20v-2h16v13h-4" />
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
  width: clamp(10rem, 20vw, 23rem);
  height: auto;
  max-width: none;
  transform: translate(-50%, -50%);
  color: var(--muted);
  opacity: 0.72;
  transition: opacity 0.35s;
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
  stroke: var(--accent);
  stroke-width: 0.85;
}
[data-open='true'] .pcb-island {
  opacity: 0.18;
}
@media (max-width: 840px), (max-height: 509px) {
  .pcb-island {
    width: 9rem;
  }
}
</style>
