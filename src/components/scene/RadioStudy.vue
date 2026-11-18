<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { Locale } from '../../lib/i18n';
const props = defineProps<{ locale: Locale }>();
const active = ref(0);
const base = import.meta.env.BASE_URL + 'media/study/';
const steps = [
  ['Спокій', 'At rest'],
  ['Перемикач', 'Switch'],
  ['Підйом', 'Lift'],
  ['Крен', 'Bank'],
  ['Посадка', 'Landing'],
];
const captions = [
  ['Коптер стоїть на місці.', 'The quad is at rest.'],
  [
    'Верхній перемикач змінює положення.',
    'The shoulder switch moves into position.',
  ],
  [
    'Між рамою й тінню з’являється просвіт.',
    'A gap opens between the frame and its shadow.',
  ],
  ['Корпус нахиляється вбік.', 'The airframe banks to one side.'],
  [
    'Рама знову торкається поверхні.',
    'The frame settles back onto the ground.',
  ],
];
const lang = props.locale === 'uk' ? 0 : 1;
function choose(i: number) {
  active.value = i;
  document
    .querySelector('[data-story]')
    ?.dispatchEvent(new CustomEvent('radio-pose', { detail: i }));
}
function follow(e: Event) {
  active.value = (e as CustomEvent<number>).detail;
}
onMounted(() =>
  document
    .querySelector('[data-story]')
    ?.addEventListener('radio-step', follow),
);
onBeforeUnmount(() =>
  document
    .querySelector('[data-story]')
    ?.removeEventListener('radio-step', follow),
);
</script>
<template>
  <div class="radio-pair">
    <span class="study-poster" role="img" aria-label="RadioMaster TX16S MK3"
      ><img
        loading="lazy"
        :src="
          base +
          'radio' +
          (active > 0 && active < 4 ? '-' + active : '') +
          '-dark.webp'
        "
        alt="" /></span
    ><slot />
  </div>
  <div class="radio-steps" :data-pose="active">
    <div
      class="radio-options"
      :aria-label="locale === 'uk' ? 'Рух коптера' : 'Quad motion'"
    >
      <button
        v-for="(s, i) in steps"
        :key="i"
        :aria-pressed="active === i"
        @click="choose(i)"
      >
        {{ s[lang] }}
      </button>
    </div>
    <p aria-live="polite">{{ captions[active][lang] }}</p>
  </div>
</template>
