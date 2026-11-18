<script setup lang="ts">
import { ref, computed } from 'vue';
import { parts, boardX, boardY } from '../../data/airframe';
import { useStudySelection } from '../../lib/useStudySelection';
import { pageUrl, type Locale } from '../../lib/i18n';
import Icon from '../ui/Icon.vue';
const props = defineProps<{ locale: Locale }>();
const { selected, choose, ready } = useStudySelection(parts, 'part');
const hover = ref<number | null>(null),
  dialog = ref<HTMLDialogElement>(),
  opener = ref<HTMLElement>();
const shown = computed(() => parts[hover.value ?? selected.value]);
const base = import.meta.env.BASE_URL + 'media/study/';
const themed = ['frame', 'canopy', 'camera', 'antenna'];
function highlight(index: number | null) {
  hover.value = index;
  document.querySelector('[data-story]')?.dispatchEvent(
    new CustomEvent('part-focus', {
      detail: index === null ? '' : parts[index].id,
    }),
  );
}
function open(event: Event, index: number) {
  choose(index);
  opener.value = event.currentTarget as HTMLElement;
  dialog.value?.showModal();
}
</script>
<template>
  <section id="anatomy" data-stop class="anatomy-chapter">
    <div class="board-pin">
      <header class="chapter-head">
        <h2>{{ locale === 'uk' ? 'Будова дрона' : 'Drone anatomy' }}</h2>
        <a :href="pageUrl(locale, 'knowledge/anatomy')"
          >{{ locale === 'uk' ? 'До конспекту' : 'Read the notes' }}
          <Icon name="next"
        /></a>
      </header>
      <div class="parts-board">
        <button
          v-for="(part, i) in parts"
          :key="part.id"
          :style="{
            '--x': boardX[part.col] * 100 + '%',
            '--y': boardY[part.row] * 100 + '%',
          }"
          class="board-part"
          :class="{ dim: hover !== null && hover !== i }"
          :disabled="!ready"
          :aria-pressed="selected === i"
          :aria-label="part[props.locale]"
          @pointerenter="highlight(i)"
          @pointerleave="highlight(null)"
          @focus="highlight(i)"
          @blur="highlight(null)"
          @click="open($event, i)"
        >
          <span class="part-render" aria-hidden="true"
            ><img
              :class="{ 'night-image': themed.includes(part.id) }"
              :src="base + part.id + '-dark.webp'"
              loading="lazy"
              alt="" /><img
              v-if="themed.includes(part.id)"
              class="day-image"
              :src="base + part.id + '-light.webp'"
              alt=""
              loading="lazy"
          /></span>
          <span class="part-label">{{ part[locale] }}</span>
        </button>
      </div>
      <div class="board-foot">
        <span class="study-note">{{ shown.description[locale] }}</span><button
          :disabled="!ready"
          :aria-label="
            (locale === 'uk' ? 'Докладніше: ' : 'Details: ') +
            parts[selected][locale]
          "
          @click="open($event, selected)"
        >
          <Icon name="details" />
        </button>
      </div>
    </div>
    <dialog
      ref="dialog"
      class="part-dialog"
      aria-labelledby="part-name"
      @close="opener?.focus({ preventScroll: true })"
      @click="
        (e) => {
          if (e.target === dialog) dialog?.close();
        }
      "
    >
      <div>
        <span class="dialog-render" aria-hidden="true"
          ><img
            :class="{ 'night-image': themed.includes(parts[selected].id) }"
            :src="base + parts[selected].id + '-dark.webp'"
            alt="" /><img
            v-if="themed.includes(parts[selected].id)"
            class="day-image"
            :src="base + parts[selected].id + '-light.webp'"
            alt=""
        /></span>
        <h3 id="part-name">{{ parts[selected][locale] }}</h3>
        <p>{{ parts[selected].description[locale] }}</p>
        <form method="dialog">
          <button autofocus>
            {{ locale === 'uk' ? 'До огляду' : 'Back to the board' }}
            <Icon name="back" />
          </button>
        </form>
      </div>
    </dialog>
  </section>
</template>
