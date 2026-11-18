<script setup lang="ts">
import { currentAircraft, type Aircraft } from '../../lib/aircraft';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { parts, boardX, boardY } from '../../data/airframe';
import { useStudySelection } from '../../lib/useStudySelection';
import { type Locale } from '../../lib/i18n';
import Icon from '../ui/Icon.vue';
const props = defineProps<{ locale: Locale }>();
const { selected, choose, ready } = useStudySelection(parts, 'part');
const hover = ref<number | null>(null),
  dialog = ref<HTMLDialogElement>(),
  opener = ref<HTMLElement>();
const shown = computed(() => parts[hover.value ?? selected.value]);
const base = import.meta.env.BASE_URL + 'media/study/';
const model = ref<Aircraft>('whoop');
function syncModel() {
  model.value = currentAircraft();
}
onMounted(() => {
  syncModel();
  window.addEventListener('aircraft-change', syncModel);
});
onBeforeUnmount(() => window.removeEventListener('aircraft-change', syncModel));
function art(id: string) {
  return (
    base +
    (model.value === 'seven' && ['frame', 'canopy'].includes(id)
      ? 'seven-'
      : '') +
    id
  );
}
function name(part: (typeof parts)[number]) {
  if (model.value === 'seven' && part.id === 'canopy')
    return props.locale === 'uk' ? 'Верхня пластина' : 'Top plate';
  return part[props.locale];
}
function description(part: (typeof parts)[number]) {
  if (model.value === 'seven') {
    if (part.id === 'frame')
      return props.locale === 'uk'
        ? 'Від центральної пластини до двигунів розходяться чотири карбонові промені.'
        : 'Four carbon arms run from the centre plate to the motors.';
    if (part.id === 'canopy')
      return props.locale === 'uk'
        ? 'Верхня пластина спирається на чотири стійки. Між пластинами видно камеру й плату.'
        : 'Four posts support the top plate. The camera and electronics sit between the plates.';
    if (part.id === 'camera')
      return props.locale === 'uk'
        ? 'Передня камера передає зображення з борту.'
        : 'The camera at the front provides the onboard view.';
    if (part.id === 'antenna')
      return props.locale === 'uk'
        ? 'Антена виступає за задній край рами.'
        : 'The antenna extends beyond the rear of the frame.';
  }
  return part.description[props.locale];
}
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
  <section
    id="anatomy"
    data-stop
    :aria-label="locale === 'uk' ? 'Будова дрона' : 'Drone anatomy'"
    class="anatomy-chapter"
  >
    <div class="board-pin">
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
          :aria-label="name(part)"
          @pointerenter="highlight(i)"
          @pointerleave="highlight(null)"
          @focus="highlight(i)"
          @blur="highlight(null)"
          @click="open($event, i)"
        >
          <span class="part-render" aria-hidden="true"
            ><img
              :class="{ 'night-image': themed.includes(part.id) }"
              :src="art(part.id) + '-dark.webp'"
              loading="lazy"
              alt="" /><img
              v-if="themed.includes(part.id)"
              class="day-image"
              :src="art(part.id) + '-light.webp'"
              alt=""
              loading="lazy"
          /></span>
          <span class="part-label">{{ name(part) }}</span>
        </button>
      </div>
      <div class="board-foot">
        <span class="study-note">{{ description(shown) }}</span><button
          :disabled="!ready"
          :aria-label="
            (locale === 'uk' ? 'Докладніше: ' : 'Details: ') +
            name(parts[selected])
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
            :src="art(parts[selected].id) + '-dark.webp'"
            alt="" /><img
            v-if="themed.includes(parts[selected].id)"
            class="day-image"
            :src="art(parts[selected].id) + '-light.webp'"
            alt=""
        /></span>
        <h3 id="part-name">{{ name(parts[selected]) }}</h3>
        <p>{{ description(parts[selected]) }}</p>
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
