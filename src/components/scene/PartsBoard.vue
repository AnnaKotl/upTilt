<script setup lang="ts">
import { topics } from '../../data/topics';
import TopicLink from '../knowledge/TopicLink.vue';
import { usePageLanguage } from '../../lib/page-language';
import { currentAircraft, type Aircraft } from '../../lib/aircraft';
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { isThemed } from '../../data/posters';
import { parts, matPosition, separateBoards } from '../../data/airframe';
import { useStudySelection } from '../../lib/useStudySelection';
import { type Locale } from '../../lib/i18n';
import StudyNote from './StudyNote.vue';
import { partArticle } from '../../data/study-titles';
const input = defineProps<{ locale: Locale }>();
const locale = usePageLanguage(input.locale);
const anatomy = topics.find((topic) => topic.id === 'anatomy')!;
const { selected, choose, ready } = useStudySelection(parts, 'part');
const hover = ref<number | null>(null),
  dialog = ref<InstanceType<typeof StudyNote>>(),
  opener = ref<HTMLElement>();
const base = import.meta.env.BASE_URL + 'media/study/';
const model = ref<Aircraft>('whoop');
function syncModel() {
  model.value = currentAircraft();
}
const settled = ref(false);
let observer: MutationObserver | undefined;
function syncBoard() {
  const stage = document.querySelector<HTMLElement>('[data-story]');
  settled.value = !stage?.dataset.live || stage.dataset.boardReady === 'true';
  if (!settled.value) {
    highlight(null);
    dialog.value?.close();
  }
}
onMounted(() => {
  syncBoard();
  observer = new MutationObserver(syncBoard);
  observer.observe(document.querySelector('[data-story]')!, {
    attributes: true,
    attributeFilter: ['data-live', 'data-board-ready'],
  });
  window.addEventListener('resize', positionDialog);
  syncModel();
  window.addEventListener('aircraft-change', syncModel);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('resize', positionDialog);
  window.removeEventListener('aircraft-change', syncModel);
});
// The 7" counterparts of these parts are a different shape and have their own
// still; everything else reuses the whoop render.
const sevenOwn = new Set(['frame', 'canopy', 'antenna']);
function poster(id: string) {
  return model.value === 'seven' && (sevenOwn.has(id) || separateBoards.has(id))
    ? 'seven-' + id
    : id;
}
function art(id: string) {
  return base + poster(id);
}
function name(part: (typeof parts)[number]) {
  if (model.value === 'seven' && part.id === 'antenna')
    return locale.value === 'uk' ? 'Антени RX / VTX' : 'RX / VTX antennas';
  if (model.value === 'seven' && part.id === 'canopy')
    return locale.value === 'uk' ? 'Верхня пластина' : 'Top plate';
  return part[locale.value];
}
function description(part: (typeof parts)[number]) {
  if (model.value === 'seven') {
    if (part.id === 'frame')
      return locale.value === 'uk'
        ? 'Від центральної пластини до двигунів розходяться чотири карбонові промені.'
        : 'Four carbon arms run from the centre plate to the motors.';
    if (part.id === 'canopy')
      return locale.value === 'uk'
        ? 'Верхня пластина спирається на чотири стійки. Між пластинами видно камеру й плату.'
        : 'Four posts support the top plate. The camera and electronics sit between the plates.';
    if (part.id === 'camera')
      return locale.value === 'uk'
        ? 'Передня камера передає зображення з борту.'
        : 'The camera at the front provides the onboard view.';
    if (part.id === 'antenna')
      return locale.value === 'uk'
        ? 'Антена виступає за задній край рами.'
        : 'The antenna extends beyond the rear of the frame.';
  }
  if (model.value === 'whoop' && part.id === 'board')
    return locale.value === 'uk'
      ? 'У компактній моделі електроніку згруповано на одній платі. Тут представлені польотний контролер, регулятори обертів, радіоприймач і відеопередавач.'
      : 'The compact study groups the flight controller, electronic speed controllers, radio receiver and video transmitter on one board.';
  return part.description[locale.value];
}
function highlight(index: number | null) {
  if (index !== null && !settled.value) return;
  hover.value = index;
  document.querySelector('[data-story]')?.dispatchEvent(
    new CustomEvent('part-focus', {
      detail: index === null ? '' : parts[index].id,
    }),
  );
}
const aliases: Record<string, [string, string]> = {
  propeller: ['Проп, пропи', 'Prop, props'],
  battery: ['Акум, батка', 'Pack'],
  board: ['Польотник', 'FC'],
  canopy: ['Канопа', 'Canopy'],
  motor: ['Мотор', 'Motor'],
  'light-strip': ['Ледка', 'LED strip'],
};
function positionDialog() {
  const box = dialog.value?.element,
    button = opener.value;
  if (!box?.open || !button) return;
  const rect = button.getBoundingClientRect();
  const cx = rect.left + rect.width / 2,
    cy = rect.top + rect.height / 2;
  const mat = document.querySelector('.bench-mat')?.getBoundingClientRect();
  const bounded =
    mat && document.querySelector('[data-story][data-live]') && mat.width > 0;
  const left = bounded ? Math.max(0, mat.left) : 0;
  const right = bounded ? Math.min(innerWidth, mat.right) : innerWidth;
  const top = bounded ? Math.max(0, mat.top) : 0;
  const bottom = bounded ? Math.min(innerHeight, mat.bottom) : innerHeight;
  const x = Math.max(
    left + 12,
    Math.min(right - box.offsetWidth - 12, cx - box.offsetWidth / 2),
  );
  const y = Math.max(
    top + 12,
    Math.min(bottom - box.offsetHeight - 12, cy - box.offsetHeight / 2),
  );
  box.style.left = x + 'px';
  box.style.top = y + 'px';
  box.style.transformOrigin = cx - x + 'px ' + (cy - y) + 'px';
}
async function open(event: Event, index: number) {
  if (!settled.value) return;
  choose(index);
  opener.value = event.currentTarget as HTMLElement;
  await nextTick();
  dialog.value?.show();
  positionDialog();
}
</script>
<template>
  <section
    id="anatomy"
    data-stop
    :aria-label="anatomy.title[locale]"
    class="anatomy-chapter"
  >
    <div class="board-pin">
      <TopicLink
        heading
        class="mat-topic"
        :inert="!settled"
        :topic="anatomy"
        :locale="locale"
      />
      <div class="parts-board">
        <button
          v-for="(part, i) in parts"
          :key="part.id"
          v-show="model === 'seven' || !separateBoards.has(part.id)"
          :style="{
            '--label-offset': 'var(--label-' + part.id + ',7svh)',
            '--part-width': part.width * 91 + '%',
            '--x': matPosition(part, model === 'seven').x * 100 + '%',
            '--y': matPosition(part, model === 'seven').y * 100 + '%',
          }"
          class="board-part"
          :class="{ dim: hover !== null && hover !== i }"
          :disabled="!ready || !settled"
          :data-part="part.id"
          :aria-pressed="selected === i"
          :aria-label="name(part)"
          @pointerenter="highlight(i)"
          @pointerleave="highlight(null)"
          @focus="highlight(i)"
          @blur="highlight(null)"
          @click="open($event, i)"
        >
          <span
            v-if="model === 'seven' || !separateBoards.has(part.id)"
            class="part-render"
            aria-hidden="true"
            ><img
              :class="{ 'night-image': isThemed(poster(part.id)) }"
              :src="art(part.id) + '-dark.webp'"
              loading="lazy"
              alt="" /><img
              v-if="isThemed(poster(part.id))"
              class="day-image"
              :src="art(part.id) + '-light.webp'"
              alt=""
              loading="lazy"
          /></span>
          <span class="part-label">{{ name(part) }}</span>
        </button>
      </div>
    </div>
    <StudyNote
      ref="dialog"
      class="anchored-dialog"
      title-id="part-name"
      :title="name(parts[selected])"
      :body="description(parts[selected])"
      :article="partArticle(parts[selected].id)"
      :locale="locale"
      @closed="opener?.focus({ preventScroll: true })"
    >
      <template #image>
        <span class="dialog-render" aria-hidden="true"
          ><img
            :class="{ 'night-image': isThemed(poster(parts[selected].id)) }"
            :src="art(parts[selected].id) + '-dark.webp'"
            alt="" /><img
            v-if="isThemed(poster(parts[selected].id))"
            class="day-image"
            :src="art(parts[selected].id) + '-light.webp'"
            alt=""
        /></span>
      </template>
      <template #alias>
        <small
          v-if="
            aliases[parts[selected].id] &&
            !(model === 'seven' && parts[selected].id === 'canopy')
          "
          >{{ aliases[parts[selected].id][locale === 'uk' ? 0 : 1] }}</small
        >
      </template>
    </StudyNote>
  </section>
</template>
<style scoped>
.mat-topic {
  --topic-icon-size: 2rem;
  width: fit-content;
  color: var(--ink);
  opacity: 1;
  transition:
    opacity var(--ui-motion),
    color var(--ui-motion);
}
.mat-topic :deep(h2) {
  font-size: clamp(0.85rem, 1.2vw, 1.2rem);
}
.mat-topic[inert] {
  opacity: 0;
}
@media (min-width: 841px) and (min-height: 510px) {
  .mat-topic {
    position: absolute;
    z-index: 2;
    top: 0;
    left: 10%;
    height: 9svh;
    align-items: center;
  }
}
@media (min-width: 1200px) and (min-height: 510px) {
  .mat-topic {
    --topic-padding: 0.15rem;
    top: 74%;
    left: calc(4.57% + var(--tap) / 2);
    height: auto;
    transform-origin: left center;
    transform: rotate(-90deg);
  }
}
</style>
