<script setup lang="ts">
import { usePageLanguage } from '../../lib/page-language';
import { type Locale, t } from '../../lib/i18n';
import { computed, ref, onMounted } from 'vue';
import Icon from '../ui/Icon.vue';
import { savePreference } from '../../lib/preferences';
const props = defineProps<{ locale?: Locale; label?: string }>();
const locale = usePageLanguage(props.locale ?? 'uk');
const label = computed(() => props.label ?? t(locale.value).theme);
const light = ref(false);
onMounted(() => {
  light.value = document.documentElement.dataset.theme === 'light';
});
function toggle() {
  light.value = !light.value;
  const theme = light.value ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  savePreference('theme', theme);
}
</script>
<template>
  <button
    class="edge-tab"
    type="button"
    role="switch"
    :aria-checked="light"
    :aria-label="label"
    @click="toggle"
  >
    <Icon :name="light ? 'sun' : 'moon'" /><span class="hint">{{ label }}</span>
  </button>
</template>
