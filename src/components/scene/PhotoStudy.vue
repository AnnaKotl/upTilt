<script setup lang="ts">
import { useStudySelection } from '../../lib/useStudySelection';
import { type Locale } from '../../lib/i18n';
import Icon from '../ui/Icon.vue';
import StudyNote from './StudyNote.vue';
import StudyLink from './StudyLink.vue';
import { partArticle } from '../../data/study-titles';
const props = defineProps<{ locale: Locale }>();
import { parts } from '../../data/specimen';
import { ref } from 'vue';
const dialog = ref<InstanceType<typeof StudyNote>>();
const marker = ref<HTMLButtonElement>();

const { selected, choose, ready } = useStudySelection(parts, 'part');
const base = import.meta.env.BASE_URL;
</script>
<template>
  <section data-stop id="anatomy" class="study page-pad">
    <div class="study-photo">
      <img
        v-for="view in ['underside', 'front']"
        :key="view"
        v-show="parts[selected].view === view"
        :src="base + 'media/' + view + '.webp'"
        loading="lazy"
        width="950"
        height="740"
        :alt="
          view === 'front'
            ? locale === 'uk'
              ? 'Коптер спереду'
              : 'Front view of the quad'
            : locale === 'uk'
              ? 'Коптер знизу'
              : 'Underside of the quad'
        "
      /><button
        type="button"
        ref="marker"
        class="locator"
        :disabled="!ready"
        :aria-label="parts[selected][locale]"
        @click="dialog?.show()"
        :style="{ left: parts[selected].x + '%', top: parts[selected].y + '%' }"
      >
        <Icon name="details" />
      </button>
    </div>
    <div>
      <h2>{{ locale === 'uk' ? 'Будова дрона' : 'Drone anatomy' }}</h2>
      <div class="part-list">
        <button
          v-for="(part, index) in parts"
          :key="part.id"
          :disabled="!ready"
          :aria-pressed="selected === index"
          @click="choose(index)"
        >
          {{ part[props.locale] }}
        </button>
      </div>
      <p class="study-note" aria-live="polite">
        {{ parts[selected].description[locale] }}
      </p>
      <StudyLink :locale="locale" :article="partArticle(parts[selected].id)" />
    </div>
    <StudyNote
      ref="dialog"
      :locale="locale"
      title-id="part-name"
      :title="parts[selected][locale]"
      :body="parts[selected].description[locale]"
      :article="partArticle(parts[selected].id)"
      @closed="marker?.focus({ preventScroll: true })"
    />
  </section>
</template>
