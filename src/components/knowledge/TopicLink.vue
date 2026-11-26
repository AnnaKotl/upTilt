<script setup lang="ts">
import type { Topic } from '../../data/topics';
import { pageUrl, type Locale } from '../../lib/i18n';
import Icon from '../ui/Icon.vue';
import LinkArrow from '../ui/LinkArrow.vue';
defineProps<{
  topic: Topic;
  locale: Locale;
  compact?: boolean;
  heading?: boolean;
}>();
</script>
<template>
  <a
    :class="compact ? 'study-link' : 'topic-row'"
    :href="pageUrl(locale, 'knowledge/' + topic.id)"
  >
    <template v-if="compact">{{ topic.title[locale] }} <LinkArrow /></template>
    <template v-else>
      <Icon :name="topic.icon" />
      <div>
        <component
          :is="heading ? 'h2' : 'strong'"
          :class="{ 'section-title': heading }"
          >{{ topic.title[locale] }} <LinkArrow
        /></component>
        <small v-if="!heading">{{ topic.summary[locale] }}</small>
      </div>
    </template>
  </a>
</template>
<style scoped>
.topic-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: clamp(0.7rem, 2vw, 1.35rem);
  padding-block: var(--topic-padding, 0.8rem);
}
.topic-row:is(:hover, :focus-visible) {
  color: var(--accent);
}
.topic-row strong {
  font: 700 clamp(1.17rem, 2vw, 1.48rem)/1.18 var(--font-display);
}
.topic-row small {
  display: block;
  margin-top: 0.3rem;
  color: var(--muted);
  font-size: 0.92rem;
}
.topic-row > svg {
  width: var(--topic-icon-size, clamp(2.1rem, 4vw, 3.15rem));
  height: auto;
  transition: transform var(--ui-motion);
}
.topic-row:is(:hover, :focus-visible) > svg {
  transform: scale(1.13);
}
</style>
