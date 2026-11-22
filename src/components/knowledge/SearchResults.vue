<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { searchTerm } from '../../lib/search-term';
import { topics } from '../../data/topics';
import type { Locale } from '../../lib/i18n';
const { locale } = defineProps<{ locale: Locale }>();
const uk = locale === 'uk';
type Hit = {
  url: string;
  meta: { title: string; trail: string };
  excerpt: string;
};
type Result = { data: () => Promise<Hit> };
const query = ref(''),
  selected = ref(''),
  total = ref(0),
  facets = ref<Record<string, number>>({});
const hits = ref<Hit[]>([]),
  loading = ref(false),
  failed = ref(false);
const limit = 16;
let matches: Result[] = [];
const remaining = computed(() => hits.value.length < matches.length);
function filterUrl(topic: string) {
  const params = new URLSearchParams({ q: query.value });
  if (topic) params.set('topic', topic);
  return '?' + params;
}
// Pagefind excerpts contain only text and match markers. Render text through Vue.
function excerptParts(excerpt: string) {
  const doc = new DOMParser().parseFromString(excerpt, 'text/html');
  return Array.from(doc.body.childNodes, (node) => ({
    text: node.textContent,
    mark: node.nodeName === 'MARK',
  }));
}
async function loadBatch(count: number) {
  const batch = matches.slice(hits.value.length, hits.value.length + count);
  hits.value.push(...(await Promise.all(batch.map((hit) => hit.data()))));
}
async function more() {
  if (loading.value) return;
  loading.value = true;
  try {
    await loadBatch(limit);
    const url = new URL(location.href);
    url.searchParams.set('page', String(Math.ceil(hits.value.length / limit)));
    history.replaceState(history.state, '', url);
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}
onMounted(async () => {
  const params = new URLSearchParams(location.search);
  query.value = params.get('q')?.trim() ?? '';
  const topic = params.get('topic');
  selected.value = topics.find((t) => t.id === topic)?.id ?? '';
  if (!query.value) return;
  loading.value = true;
  try {
    const moduleUrl = new URL(
      import.meta.env.BASE_URL + 'search-index/pagefind.js',
      location.origin,
    ).href;
    const index = await import(/* @vite-ignore */ moduleUrl);
    await index.options({
      basePath: import.meta.env.BASE_URL + 'search-index/',
      excerptLength: 28,
    });
    await index.filters();
    const term = searchTerm(query.value, locale);
    const response = await index.search(
      term,
      selected.value ? { filters: { topic: selected.value } } : {},
    );
    matches = response.results;
    facets.value = response.totalFilters?.topic ?? response.filters.topic ?? {};
    total.value = response.unfilteredResultCount ?? matches.length;
    const page = Math.max(
      1,
      Number.parseInt(params.get('page') ?? '1', 10) || 1,
    );
    await loadBatch(Math.min(matches.length, page * limit));
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
});
const status = computed(() => {
  if (failed.value)
    return uk
      ? 'Не вдалося завантажити пошук. Онови сторінку.'
      : 'Search could not load. Refresh the page.';
  if (loading.value) return uk ? 'Шукаємо…' : 'Searching…';
  if (!query.value)
    return uk
      ? 'Введи запит і натисни Enter.'
      : 'Enter a query and press Enter.';
  if (!hits.value.length)
    return uk
      ? 'Збігів немає. Спробуй інший термін.'
      : 'No matches. Try another term.';
  return (
    (uk ? 'Знайдено' : 'Matches') +
    ' · ' +
    (selected.value ? matches.length : total.value)
  );
});
</script>
<template>
  <p v-if="query" class="search-query">«{{ query }}»</p>
  <p class="search-status" role="status">{{ status }}</p>
  <nav
    v-if="total"
    class="search-facets"
    :aria-label="uk ? 'Напрями' : 'Categories'"
  >
    <a :href="filterUrl('')" :aria-current="!selected ? 'page' : undefined"
      >{{ uk ? 'Усі' : 'All' }} · {{ total }}</a
    >
    <template v-for="topic in topics" :key="topic.id">
      <a
        v-if="facets[topic.id]"
        :href="filterUrl(topic.id)"
        :aria-current="selected === topic.id ? 'page' : undefined"
        >{{ topic.title[locale] }} · {{ facets[topic.id] }}</a
      >
    </template>
  </nav>
  <ol class="search-results">
    <li v-for="hit in hits" :key="hit.url">
      <a :href="hit.url">
        <small>{{
          hit.meta.trail || (uk ? 'База знань' : 'Knowledge base')
        }}</small>
        <h2>{{ hit.meta.title }} ↗</h2>
        <p>
          <template v-for="(part, i) in excerptParts(hit.excerpt)" :key="i"
            ><mark v-if="part.mark">{{ part.text }}</mark
            ><template v-else>{{ part.text }}</template></template
          >
        </p>
      </a>
    </li>
  </ol>
  <button
    v-if="remaining && !failed"
    class="more-results"
    type="button"
    @click="more"
    :disabled="loading"
    :title="uk ? 'Показати ще' : 'Show more'"
    :aria-label="uk ? 'Показати ще' : 'Show more'"
  >
    ↓
  </button>
</template>
