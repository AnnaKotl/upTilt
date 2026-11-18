import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import { templateCompilerOptions } from '@tresjs/core';
export default defineConfig({
  site: 'https://annakotl.github.io',
  base: '/upTilt',
  trailingSlash: 'always',
  output: 'static',
  integrations: [vue(templateCompilerOptions)],
  vite: { plugins: [tailwindcss()] },
});
