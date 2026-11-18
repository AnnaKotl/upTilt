import { onMounted, onBeforeUnmount, ref } from 'vue';
import type { Locale } from './i18n';
export function usePageLanguage(initial: Locale) {
  const locale = ref(initial);
  const sync = () => {
    locale.value = document.documentElement.lang === 'uk' ? 'uk' : 'en';
  };
  onMounted(() => {
    sync();
    window.addEventListener('page-language', sync);
  });
  onBeforeUnmount(() => window.removeEventListener('page-language', sync));
  return locale;
}
