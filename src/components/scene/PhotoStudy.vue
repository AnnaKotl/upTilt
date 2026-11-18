<script setup lang="ts">
import { useStudySelection } from '../../lib/useStudySelection';
import { type Locale, t, pageUrl } from '../../lib/i18n';
import Icon from '../ui/Icon.vue';
const props = defineProps<{ locale: Locale }>();
import { parts } from '../../data/specimen';
import { ref } from 'vue';
const dialog = ref<HTMLDialogElement>();
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
        :aria-label="
          (locale === 'uk' ? 'Докладніше: ' : 'Details: ') +
          parts[selected][locale]
        "
        @click="dialog?.showModal()"
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
      <a class="inline-link" :href="pageUrl(locale, 'knowledge/anatomy')"
        >{{ t(locale).knowledge }} <Icon name="next"
      /></a>
    </div>
    <dialog
      ref="dialog"
      class="part-dialog"
      @close="marker?.focus({ preventScroll: true })"
      aria-labelledby="part-name"
      @click="
        (event) => {
          if (event.target === dialog) dialog?.close();
        }
      "
    >
      <div>
        <h3 id="part-name">{{ parts[selected][locale] }}</h3>
        <p>{{ parts[selected].description[locale] }}</p>
        <form method="dialog">
          <button autofocus>
            {{ locale === 'uk' ? 'До огляду' : 'Back to the photo' }}
            <Icon name="back" />
          </button>
        </form>
      </div>
    </dialog>
  </section>
</template>
