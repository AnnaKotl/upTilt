import { onMounted, ref } from 'vue';
// The same query keys work in both locales and in shared links.
export function useStudySelection(
  items: readonly { id: string }[],
  key: string,
) {
  const selected = ref(0);
  const ready = ref(false);
  onMounted(() => {
    const id = new URL(location.href).searchParams.get(key);
    const index = items.findIndex((item) => item.id === id);
    if (index >= 0) selected.value = index;
    ready.value = true;
  });
  function choose(index: number) {
    selected.value = index;
    const url = new URL(location.href);
    url.searchParams.set(key, items[index].id);
    history.replaceState(history.state, '', url);
  }
  return { selected, choose, ready };
}
