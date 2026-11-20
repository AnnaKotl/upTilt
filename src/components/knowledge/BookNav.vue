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
    [81, 28],
    [173, 17],
    [235, 48],
    [245, 120],
    [195, 168],
    [113, 181],
    [47, 151],
    [24, 80],
  ];
  const [x, y] = sockets[i % sockets.length];
  return { x, y: (y * height) / 208 };
}
function trace(i: number) {
  const { x, y } = port(i);
  const cx = 135,
    cy = height / 2,
    dx = x - cx,
    dy = y - cy;
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
