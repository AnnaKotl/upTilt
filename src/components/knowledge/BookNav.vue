<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Icon from '../ui/Icon.vue';
import { topics } from '../../data/topics';
import { pageUrl, t, type Locale } from '../../lib/i18n';
const props = defineProps<{ locale: Locale }>();
const expanded = ref(false);
const trigger = ref<HTMLButtonElement>();
const menu = ref<HTMLElement>();
const pinned = ref(false);
const ready = ref(false);
onMounted(() => {
  ready.value = true;
});
function close() {
  expanded.value = false;
  pinned.value = false;
}
function toggle() {
  if (pinned.value) {
    close();
    return;
  }
  expanded.value = true;
  pinned.value = true;
}
function escape() {
  trigger.value?.focus();
  close();
}
function leave(event: FocusEvent) {
  if (!menu.value?.contains(event.relatedTarget as Node)) close();
}
function hover(event: PointerEvent) {
  if (event.pointerType === 'mouse') expanded.value = true;
}
function pointerLeave() {
  if (!pinned.value && !menu.value?.contains(document.activeElement)) close();
}
const height = Math.max(208, topics.length * 23);
function port(i: number) {
  const angle = (i * 2 * Math.PI) / topics.length - Math.PI / 2;
  return {
    x: 135 + 112 * Math.cos(angle),
    y: height / 2 + (height / 2 - 22) * Math.sin(angle),
  };
}
function trace(i: number) {
  const { x, y } = port(i);
  return `M135 ${height / 2} L${x} ${y}`;
}
</script>
<template>
  <nav
    ref="menu"
    class="book-nav"
    :aria-label="t(props.locale).knowledge"
    @keydown.esc.prevent="escape"
    @focusout="leave"
    @pointerleave="pointerLeave"
  >
    <div
      class="core-cluster"
      :style="{ '--tree-height': height + 'px' }"
      :data-open="expanded"
    >
      <button
        ref="trigger"
        :disabled="!ready"
        type="button"
        class="book-trigger"
        aria-controls="book-branches"
        :aria-expanded="expanded"
        :aria-label="t(locale).knowledge"
        @pointerenter="hover"
        @focus="expanded = true"
        @click="toggle"
      >
        <span class="book-chip"><Icon name="book" /></span
        ><span class="core-caption">{{ t(locale).knowledge }}</span>
      </button>
      <div id="book-branches" :hidden="!expanded" class="core-branches">
        <svg
          class="core-copper"
          :viewBox="'0 0 270 ' + height"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g
            v-for="(topic, i) in topics"
            :key="topic.id"
            :style="{ '--delay': i * 38 + 'ms' }"
          >
            <path :d="trace(i)" pathLength="1" />
            <circle :cx="port(i).x" :cy="port(i).y" r="4" />
          </g>
        </svg>
        <a
          v-for="(topic, i) in topics"
          :key="topic.id"
          class="core-port"
          :href="pageUrl(locale, 'knowledge/' + topic.id)"
          :aria-label="topic.title[locale]"
          :style="{
            '--x': (port(i).x / 270) * 100 + '%',
            '--y': (port(i).y / height) * 100 + '%',
            '--delay': i * 38 + 'ms',
          }"
          ><Icon :name="topic.icon" /><span>{{ topic.title[locale] }}</span></a
        >
      </div>
    </div>
  </nav>
</template>
