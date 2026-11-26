import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { build } from 'vite';
const result = await build({
  configFile: false,
  build: {
    write: false,
    lib: {
      entry: 'scripts/poster-scene.ts',
      formats: ['iife'],
      name: 'StudyPoster',
    },
  },
});
const bundle = (Array.isArray(result) ? result[0] : result).output.find(
  (item) => item.type === 'chunk',
);
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.setContent('<body></body>');
  await page.addScriptTag({ content: bundle.code });
  // The manifest in src/data/posters.ts decides what is rendered and in which
  // themes. There is no second list to keep in step.
  const posters = await page.evaluate(() => window.StudyPoster.posters);
  for (const [id, theme] of Object.entries(posters)) {
    for (const shade of theme === 'themed' ? ['dark', 'light'] : ['dark']) {
      const data = await page.evaluate(
        ([id, shade]) => window.StudyPoster.capture(id, shade === 'light'),
        [id, shade],
      );
      await writeFile(
        'public/media/study/' + id + '-' + shade + '.webp',
        Buffer.from(data, 'base64'),
      );
    }
  }
  const controlPositions = await page.evaluate(
    () => window.StudyPoster.posterControls,
  );
  await writeFile(
    'src/data/radio-poster.json',
    JSON.stringify(controlPositions, null, 2) + '\n',
  );
} finally {
  await browser.close();
}
