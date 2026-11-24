<script setup lang="ts">
import { ref } from 'vue';
import Icon from '../ui/Icon.vue';
import StudyLink from './StudyLink.vue';
import type { StudyPath } from '../../data/study-titles';
import type { Locale } from '../../lib/i18n';
defineProps<{
  title: string;
  body: string;
  locale: Locale;
  article: StudyPath;
  titleId?: string;
}>();
const dialog = ref<HTMLDialogElement>();
defineEmits<{ closed: [] }>();
defineExpose({
  show: () => dialog.value?.showModal(),
  close: () => dialog.value?.close(),
  element: dialog,
});
</script>
<template>
  <dialog
    class="part-dialog study-note-dialog"
    ref="dialog"
    :aria-label="title"
    :aria-labelledby="titleId"
    @close="$emit('closed')"
    @click="
      (e) => {
        if (e.target === dialog) dialog?.close();
      }
    "
  >
    <div>
      <form method="dialog" class="note-close">
        <button autofocus :aria-label="locale === 'uk' ? 'Закрити' : 'Close'">
          <Icon name="close" />
        </button>
      </form>
      <slot name="image" />
      <h3 :id="titleId">{{ title }}</h3>
      <slot name="alias" />
      <p>{{ body }}</p>
      <StudyLink :article="article" :locale="locale" />
    </div>
  </dialog>
</template>
