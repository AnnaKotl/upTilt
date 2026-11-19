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
const flightSeconds = ref(0);
const furthest = ref(0);
const time = computed(() =>
  Math.min(420, flightSeconds.value + furthest.value * 380),
);
const voltage = computed(() => Math.max(3.38, 4.35 - time.value * 0.0039));
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
  flightSeconds.value = (elapsed / 1000) * 5;
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
  if (time.value < 420) timer = window.setTimeout(advance, 200);
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
    advance();
  }
  const p = Math.max(0, Math.min(1, -box.top / Math.max(1, box.height - h)));
  if (inside && !reduced()) furthest.value = Math.max(furthest.value, p);
  const strength = Math.min(1, Math.max(0, (p - 0.24) / 0.7));
  const exit = strength * strength * (3 - 2 * strength);
  const approach = Math.min(1, Math.max(0, box.top / h));
  const style = surface.value.style;
  const imageIn = Math.max(0, Math.min(1, (0.65 - approach) / 0.49));
  const dissolve = Math.max(0, Math.min(1, (p - 0.975) / 0.025));
  style.setProperty(
    '--signal-image',
    String(reduced() ? 1 : imageIn * (1 - exit ** 2)),
  );
  style.setProperty('--signal-visible', String(reduced() ? 1 : 1 - dissolve));
  style.setProperty('--drift', (reduced() ? 0 : (p - 0.45) * 142) + 'px');
  style.setProperty('--tilt', (reduced() ? 0 : (p - 0.45) * 3.8) + 'deg');
  style.setProperty(
    '--bands',
    String(reduced() ? 0 : Math.sin(exit * Math.PI) * 0.42),
  );
  style.setProperty('--zoom', String(reduced() ? 1 : 1.04 + 0.19 * p));
  style.setProperty('--dropout', String(reduced() ? 0 : exit ** 2));
  style.setProperty('--hud-opacity', String(reduced() ? 1 : 1 - exit ** 3));
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
  elapsed = previous = phase.value = flightSeconds.value = furthest.value = 0;
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
    value: '00:00',
    uk: 'Таймер',
    en: 'Timer',
    text: {
      uk: 'Час від початку цього польоту у хвилинах і секундах.',
      en: 'Time since the start of this flight, in minutes and seconds.',
    },
  },
  {
    id: 'voltage',
    value: '4.35 V',
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
    value: '0 mAh',
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
      uk: 'Частка очікуваних пакетів керування, які отримав приймач, у відсотках.',
      en: 'The percentage of expected control packets received.',
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
      uk: 'Висота відносно початкової позначки.',
      en: 'Height relative to the starting reference.',
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
  {
    id: 'speed',
    uk: 'Наземна швидкість',
    en: 'Ground speed',
    value: '18 km/h',
    text: {
      uk: 'Швидкість відносно землі за даними GPS. Набір полів залежить від датчиків і профілю OSD.',
      en: 'GPS speed over the ground. The available fields depend on the sensors and OSD profile.',
    },
  },
] as const;
function reading(field: (typeof fields)[number]) {
  if (!time.value) return field.value;
  const t = time.value;
  const wave = Math.sin(t / 8);
  switch (field.id) {
    case 'time':
      return [Math.floor(t / 60), Math.floor(t) % 60]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
    case 'voltage':
      return voltage.value.toFixed(2) + ' V';
    case 'current':
      return (3.4 + 1.3 * wave).toFixed(1) + ' A';
    case 'charge':
      return (
        Math.round((3.4 * t + 10.4 * (1 - Math.cos(t / 8))) / 3.6) + ' mAh'
      );
    case 'rpm':
      return Math.round((10200 + 1350 * wave) / 10) * 10 + ' RPM';
    case 'link':
      return 'LQ ' + Math.round(98 + 2 * Math.cos(t / 9));
    case 'altitude':
      return Math.round(12 + 3 * Math.sin(t / 17)) + ' m';
    case 'speed':
      return Math.round(18 + 4 * wave) + ' km/h';
    case 'compass':
      return (Math.round((360 + 18 * Math.sin(t / 16)) % 360) % 360) + '°';
    case 'position':
      return (
        (48 + 0.0006 * Math.sin(t / 22)).toFixed(4) +
        '° N · ' +
        (16 + 0.0003 * Math.cos(t / 22)).toFixed(4) +
        '° E'
      );
  }
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
          {{ voltage <= 3.48 ? 'LOW BATTERY' : phase === 1 ? 'ARMED' : '' }}
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
              ><i>NW</i><i>{{ reading(field) }}</i
              ><i>NE</i></span
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
