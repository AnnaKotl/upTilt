<script setup lang="ts">
import LinkArrow from '../ui/LinkArrow.vue';
import { studyTitles, type StudyPath } from '../../data/study-titles';
import { pageUrl, type Locale } from '../../lib/i18n';
defineProps<{ locale: Locale; article: StudyPath }>();
</script>
<template>
  <a class="study-link" :href="pageUrl(locale, 'knowledge/' + article)">
    {{ studyTitles[article][locale === 'uk' ? 0 : 1] }}
    <LinkArrow />
  </a>
</template>
