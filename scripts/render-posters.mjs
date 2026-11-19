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
  const themed = new Set([
    'kit-seven',
    'kit-whoop',
    'whoop',
    'frame',
    'canopy',
    'camera',
    'antenna',
    'seven',
    'seven-antenna',
    'seven-frame',
    'seven-canopy',
  ]);
  for (const id of [
    'seven',
    'seven-antenna',
    'seven-frame',
    'seven-canopy',
    'whoop',
    'frame',
    'canopy',
    'camera',
    'antenna',
    'motor',
    'board',
    'battery',
    'propeller',
    'light-strip',
    'mounts',
    'connector',
    'power-lead',
    'battery-holder',
    'gate',
    'radio',
    'radio-off',
    'radio-1',
    'radio-2',
    'radio-3',
    'radio-4',
    'radio-5',
    'radio-6',
    'radio-7',
    'seven-esc',
    'seven-receiver',
    'seven-video',
    'radio-8',
    'kit-seven',
    'kit-whoop',
    'kit-battery',
    'kit-radio',
    'kit-goggles',
  ]) {
    for (const theme of themed.has(id) ? ['dark', 'light'] : ['dark']) {
      const data = await page.evaluate(
        ([id, theme]) => window.StudyPoster.capture(id, theme === 'light'),
        [id, theme],
      );
      await writeFile(
        'public/media/study/' + id + '-' + theme + '.webp',
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
