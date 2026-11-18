<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStudySelection } from '../../lib/useStudySelection';
import { type Locale } from '../../lib/i18n';
defineProps<{ locale: Locale }>();
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
] as const;
const { selected, choose, ready } = useStudySelection(fields, 'field');
const hover = ref<number | null>(null);
const shown = computed(() => fields[hover.value ?? selected.value]);
</script>
<template>
  <section id="display" data-stop class="goggle-view">
    <div class="view-land" aria-hidden="true">
      <img
        v-for="theme in ['dusk', 'day']"
        :key="theme"
        :class="'land-' + theme"
        :src="base + 'lake-' + theme + '.webp'"
        loading="lazy"
        alt=""
      />
    </div>
    <div class="view-shade"></div>
    <header class="goggle-head">
      <h2>{{ locale === 'uk' ? 'В окулярах' : 'Inside the goggles' }}</h2>
      <span>{{ locale === 'uk' ? 'Приклад OSD' : 'Sample OSD' }}</span>
    </header>
    <div class="osd-hud">
      <button
        v-for="(field, i) in fields"
        :key="field.id"
        :class="'hud-' + field.id"
        :disabled="!ready"
        :aria-label="field[locale] + ' · ' + field.value"
        :aria-pressed="selected === i"
        @pointerenter="hover = i"
        @pointerleave="hover = null"
        @focus="hover = i"
        @blur="hover = null"
        @click="choose(i)"
      >
        <span>{{ field[locale] }}</span>{{ field.value }}
      </button>
      <div class="horizon-tick" aria-hidden="true"><i></i>○<i></i></div>
    </div>
    <div class="osd-note" aria-live="polite">
      <b>{{ shown[locale] }}</b>
      <p>{{ shown.text[locale] }}</p>
    </div>
  </section>
</template>
