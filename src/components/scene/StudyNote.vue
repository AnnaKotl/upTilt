<script setup lang="ts">
import { ref } from 'vue';
import Icon from '../ui/Icon.vue';
defineProps<{ title: string; body: string; back: string }>();
const dialog = ref<HTMLDialogElement>();
defineExpose({ show: () => dialog.value?.showModal() });
</script>
<template>
  <dialog
    class="part-dialog study-note-dialog"
    ref="dialog"
    :aria-label="title"
    @click="
      (e) => {
        if (e.target === dialog) dialog?.close();
      }
    "
  >
    <div>
      <h3>{{ title }}</h3>
      <p>{{ body }}</p>
      <form method="dialog">
        <button autofocus>{{ back }} <Icon name="forward" /></button>
      </form>
    </div>
  </dialog>
</template>
