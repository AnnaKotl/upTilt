<script setup lang="ts">
import { usePageLanguage } from '../../lib/page-language';
import { usePointerNote } from '../../lib/usePointerNote';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStudySelection } from '../../lib/useStudySelection';
import { type Locale } from '../../lib/i18n';
import StudyNote from './StudyNote.vue';
const input = defineProps<{ locale: Locale }>();
const locale = usePageLanguage(input.locale);
const modal = ref<InstanceType<typeof StudyNote>>(),
  chapter = ref<HTMLElement>();
const phase = ref(0);
let timer = 0,
  frame = 0,
  elapsed = 0,
  previous = 0,
  visible = false;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function advance() {
  clearTimeout(timer);
  if (!visible || document.hidden || reduced()) return;
  const now = performance.now();
  elapsed += previous ? Math.min(500, now - previous) : 0;
  previous = now;
  phase.value =
    elapsed < 1300
      ? 1
      : elapsed < 2600
        ? 2
        : elapsed < 3450
          ? 3
          : elapsed < 5500
            ? 4
            : 5;
  if (phase.value < 5) timer = window.setTimeout(advance, 200);
}
function measure() {
  frame = 0;
  if (!chapter.value || !surface.value) return;
  const box = chapter.value.getBoundingClientRect(),
    h = innerHeight;
  const inside = box.top < h * 0.38 && box.bottom > h * 0.36;
  if (inside !== visible) {
    visible = inside;
    previous = 0;
    if (!inside) {
      elapsed = 0;
      phase.value = 0;
    }
    advance();
  }
  const p = Math.max(0, Math.min(1, -box.top / Math.max(1, box.height - h)));
  const exit = Math.min(1, Math.max(0, (p - 0.63) / 0.28));
  const approach = Math.min(1, Math.max(0, box.top / h));
  const style = surface.value.style;
  const imageIn = Math.max(0, Math.min(1, (0.65 - approach) / 0.49));
  const dissolve = Math.max(0, Math.min(1, (p - 0.91) / 0.09));
  style.setProperty(
    '--signal-image',
    String(reduced() ? 1 : imageIn * (1 - exit)),
  );
  style.setProperty('--signal-visible', String(reduced() ? 1 : 1 - dissolve));
  style.setProperty('--drift', (reduced() ? 0 : (p - 0.45) * 90) + 'px');
  style.setProperty('--tilt', (reduced() ? 0 : (p - 0.45) * 3.8) + 'deg');
  style.setProperty('--dropout', String(reduced() ? 0 : exit));
  style.setProperty('--hud-opacity', String(reduced() ? 1 : 1 - exit));
}
function look(event: PointerEvent) {
  if (!surface.value || reduced() || event.pointerType !== 'mouse') return;
  const rect = surface.value.getBoundingClientRect();
  surface.value.style.setProperty(
    '--look',
    ((event.clientX - rect.left) / rect.width - 0.5) * 32 + 'px',
  );
}
function scroll() {
  if (!frame) frame = requestAnimationFrame(measure);
}
function visibility() {
  previous = 0;
  advance();
}
function reset() {
  elapsed = previous = phase.value = 0;
  advance();
  measure();
}
onMounted(() => {
  measure();
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('resize', scroll);
  window.addEventListener('tour-restart', reset);
  document.addEventListener('visibilitychange', visibility);
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  cancelAnimationFrame(frame);
  window.removeEventListener('scroll', scroll);
  window.removeEventListener('resize', scroll);
  window.removeEventListener('tour-restart', reset);
  document.removeEventListener('visibilitychange', visibility);
});
const { surface, noteAt, place } = usePointerNote();
const credits = import.meta.env.BASE_URL + 'media/credits.txt';
const base = import.meta.env.BASE_URL + 'media/study/';
const fields = [
  {
    id: 'time',
    value: '01:24',
    uk: 'Таймер',
    en: 'Timer',
    text: {
      uk: 'Час від початку цього польоту у хвилинах і секундах.',
      en: 'Time since the start of this flight, in minutes and seconds.',
    },
  },
  {
    id: 'voltage',
    value: '3.8 V',
    uk: 'Напруга',
    en: 'Battery voltage',
    text: {
      uk: 'Напруга акумулятора вимірюється у вольтах. Тут показано одну комірку.',
      en: 'Battery voltage is measured in volts. This example shows a single cell.',
    },
  },
  {
    id: 'current',
    value: '2.1 A',
    uk: 'Струм',
    en: 'Current',
    text: {
      uk: 'Це струм, який у цей момент споживає коптер. Його вимірюють в амперах.',
      en: 'The current drawn by the quad at this instant, measured in amperes.',
    },
  },
  {
    id: 'charge',
    value: '48 mAh',
    uk: 'Витрачений заряд',
    en: 'Charge used',
    text: {
      uk: 'Лічильник показує, скільки заряду вже витрачено з акумулятора.',
      en: 'The counter shows how much charge the quad has drawn from the battery.',
    },
  },
  {
    id: 'link',
    value: 'LQ 100',
    uk: 'Якість зв’язку',
    en: 'Link quality',
    text: {
      uk: 'У цьому прикладі приймач отримав усі очікувані пакети керування.',
      en: 'In this example, the receiver got every expected control packet.',
    },
  },
  {
    id: 'compass',
    value: 'N',
    uk: 'Компас',
    en: 'Compass',
    text: {
      uk: 'Центральна позначка показує курс коптера. Літера N означає північ.',
      en: 'The centre mark shows the heading of the quad. N stands for north.',
    },
  },
  {
    id: 'altitude',
    uk: 'Висота',
    en: 'Altitude',
    value: '12 m',
    text: {
      uk: 'Висота відносно початкової позначки. На цьому кадрі коптер на дванадцять метрів вище за неї.',
      en: 'Height relative to the starting reference. The quad is twelve metres above it in this frame.',
    },
  },
  {
    id: 'rpm',
    uk: 'Оберти двигуна',
    en: 'Motor speed',
    value: '9 200 RPM',
    text: {
      uk: 'Кількість обертів двигуна за хвилину. Це умовний показник для цього кадру.',
      en: 'Motor revolutions per minute. The value shown here belongs to the sample scene.',
    },
  },
  {
    id: 'position',
    uk: 'Координати',
    en: 'Coordinates',
    value: '48.00° N · 16.00° E',
    text: {
      uk: 'Спочатку показано широту, потім довготу. Координати тут умовні.',
      en: 'Latitude comes first, followed by longitude. These are sample coordinates.',
    },
  },
] as const;
function reading(field: (typeof fields)[number]) {
  if (phase.value < 2) return field.value;
  if (field.id === 'time') return '01:' + String(24 + phase.value);
  if (field.id === 'rpm')
    return (
      ['9 200', '9 200', '10 100', '9 700', '9 350', '8 900'][phase.value] +
      ' RPM'
    );
  if (field.id === 'current')
    return phase.value === 5 ? '1.8 A' : phase.value === 2 ? '2.4 A' : '2.2 A';
  if (field.id === 'charge') return 48 + phase.value + ' mAh';
  if (field.id === 'voltage')
    return phase.value === 5 ? '3.4 V' : phase.value === 4 ? '3.6 V' : '3.8 V';
  return field.value;
}
function inspect(i: number) {
  choose(i);
  hover.value = null;
  modal.value?.show();
}
const { selected, choose, ready } = useStudySelection(fields, 'field');
const hover = ref<number | null>(null);
const shown = computed(() => fields[hover.value ?? selected.value]);
</script>
<template>
  <section ref="chapter" id="display" data-stop class="goggle-chapter">
    <div
      ref="surface"
      :aria-label="
        locale === 'uk' ? 'Телеметрія в окулярах' : 'Goggle telemetry'
      "
      @keydown.esc="hover = null"
      :data-phase="phase"
      class="goggle-view"
      @pointermove="look"
      @pointerleave="surface?.style.removeProperty('--look')"
    >
      <div class="view-land" aria-hidden="true">
        <img
          :src="base + 'forest-lake.webp'"
          width="1280"
          height="853"
          loading="lazy"
          decoding="async"
          alt=""
        />
      </div>
      <div class="view-shade"></div>
      <div class="season-weather" aria-hidden="true"></div>
      <a class="photo-credit" :href="credits" lang="en"
        >Halobenzene · CC BY-SA</a
      >
      <div
        class="video-noise"
        :style="{ backgroundImage: `url(${base}video-grain.png)` }"
        aria-hidden="true"
      ></div>
      <div class="osd-hud">
        <div class="osd-status">
          {{ phase === 1 ? 'ARMED' : phase === 5 ? 'LOW BATTERY' : '' }}
        </div>
        <button
          v-for="(field, i) in fields"
          :key="field.id"
          :class="'hud-' + field.id"
          :disabled="!ready"
          :aria-label="field[locale] + ' · ' + reading(field)"
          :aria-pressed="selected === i"
          @pointerenter="
            hover = i;
            place($event);
          "
          @pointermove="place"
          @pointerleave="hover = null"
          @focus="
            hover = i;
            place($event);
          "
          @blur="hover = null"
          @click="inspect(i)"
          :aria-describedby="hover === i ? 'osd-note' : undefined"
        >
          <template v-if="field.id === 'compass'"
            ><span class="compass-tape" aria-hidden="true"
              ><i>NW</i><i>N</i><i>NE</i></span
            ></template
          >
          <template v-else
            ><span class="osd-icon" aria-hidden="true">{{
              ['◷', '▰', 'ϟ'][i]
            }}</span
            >{{ reading(field) }}</template
          >
        </button>
        <div class="horizon-tick" aria-hidden="true"><i></i>○<i></i></div>
      </div>
      <div
        v-if="hover !== null"
        id="osd-note"
        class="osd-note cursor-note"
        :style="noteAt"
        role="tooltip"
      >
        <b>{{ shown[locale] }}</b>
        <p>{{ shown.text[locale] }}</p>
      </div>
      <StudyNote
        ref="modal"
        :title="fields[selected][locale]"
        :body="fields[selected].text[locale]"
        :back="locale === 'uk' ? 'До показників' : 'Back to the display'"
      />
    </div>
  </section>
</template>
