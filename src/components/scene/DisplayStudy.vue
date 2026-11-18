<script setup lang="ts">
import { usePointerNote } from '../../lib/usePointerNote';
import { ref, computed } from 'vue';
import { useStudySelection } from '../../lib/useStudySelection';
import { type Locale } from '../../lib/i18n';
defineProps<{ locale: Locale }>();
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
      uk: 'Від початку умовного польоту минула хвилина й 24 секунди.',
      en: 'One minute and 24 seconds have elapsed in this sample flight.',
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
] as const;
const { selected, choose, ready } = useStudySelection(fields, 'field');
const hover = ref<number | null>(null);
const shown = computed(() => fields[hover.value ?? selected.value]);
</script>
<template>
  <section
    ref="surface"
    :aria-label="locale === 'uk' ? 'Телеметрія в окулярах' : 'Goggle telemetry'"
    @keydown.esc="hover = null"
    id="display"
    data-stop
    class="goggle-view"
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
    <a class="photo-credit" :href="credits" lang="en">Halobenzene · CC BY-SA</a>
    <div class="osd-hud">
      <button
        v-for="(field, i) in fields"
        :key="field.id"
        :class="'hud-' + field.id"
        :disabled="!ready"
        :aria-label="field[locale] + ' · ' + field.value"
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
        @click="
          choose(i);
          hover = i;
          place($event);
        "
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
          >{{ field.value }}</template
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
  </section>
</template>
