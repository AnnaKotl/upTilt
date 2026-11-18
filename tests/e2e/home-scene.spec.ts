import { expect, test } from '@playwright/test';

test('one desktop scene follows the gate, parts board and radio in both themes', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'The GPU path is covered in Chromium.');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('uk/?season=autumn');
  const scene = page.locator('[data-story]');
  await expect(scene).toHaveAttribute('data-live', 'true');
  await expect(scene.locator('canvas')).toHaveCount(1);
  await expect(scene.locator('header, [data-replay]')).toHaveCount(0);
  await expect(page.locator('.scatter')).toHaveClass(/blown/);
  await expect(scene).toHaveAttribute('data-airborne', 'true');
  await expect(page.locator('.scatter')).toBeHidden();
  await page.screenshot({ path: test.info().outputPath('graphite.png') });
  await page.getByRole('switch').click();
  await page.mouse.move(3, 890);
  await page.waitForTimeout(800);
  await page.screenshot({ path: test.info().outputPath('white.png') });
  for (const id of ['motion', 'anatomy', 'radio', 'display']) {
    await page.locator('#' + id).evaluate((e) =>
      window.scrollTo({
        top: e.getBoundingClientRect().top + scrollY,
        behavior: 'instant',
      }),
    );
    await page.waitForTimeout(600);
    await page.screenshot({ path: test.info().outputPath(id + '.png') });
  }
  await page.locator('#radio').evaluate((e) =>
    window.scrollTo({
      top: e.getBoundingClientRect().top + scrollY,
      behavior: 'instant',
    }),
  );
  await expect(page.locator('.radio-study')).toHaveAttribute(
    'data-complete',
    'true',
    {
      timeout: 12000,
    },
  );
  const stick = page.getByRole('button', { name: 'Правий стік' });
  await stick.hover();
  await expect(page.getByRole('tooltip')).toContainText('Правий стік');
  await expect(page.locator('.radio-study')).toHaveAttribute('data-pose', '3');
  await page.getByRole('button', { name: 'Вибрати коптер' }).click();
  await page.getByRole('button', { name: 'Карбонова рама · 7″' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-aircraft', 'seven');
  await page.reload();
  await expect(page.locator('.scatter')).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Верхня пластина', exact: true }),
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('season previews and the no-motion scene work from a direct link', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const season of ['winter', 'summer', 'spring', 'autumn']) {
    await page.goto('en/?season=' + season);
    await expect(page.locator('html')).toHaveAttribute('data-season', season);
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('.hero-machine img').first()).toBeVisible();
  }
  await page.getByRole('button', { name: 'Battery', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('rechargeable');
});
test('the home bookmark follows the current language', async ({ page }) => {
  await page.goto('uk/knowledge/video/');
  await page.getByRole('link', { name: 'На головну сторінку' }).click();
  await expect(page).toHaveURL(/\/upTilt\/uk\/$/);
});

test('the mobile poster follows the selected frame and keeps its controls reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('en/?season=winter');
  await page.getByRole('button', { name: 'Choose aircraft' }).click();
  await page.getByRole('button', { name: 'Open frame · 7″' }).click();
  await expect(page.locator('.hero-machine .day-image')).toHaveAttribute(
    'src',
    /seven-light.webp$/,
  );
  await page.getByRole('button', { name: 'Top plate', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Four posts');
  await page.keyboard.press('Escape');
  const stick = page.getByRole('button', { name: 'Right stick', exact: true });
  await stick.click();
  await expect(page.getByRole('dialog')).toContainText('Roll banks');
  await expect(page.locator('.radio-study')).toHaveAttribute('data-pose', '3');
  await expect(page.locator('.radio-pair img').first()).toHaveAttribute(
    'src',
    /radio-3-dark.webp$/,
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Compass · N' }).click();
  await expect(page.getByRole('dialog')).toContainText('north');
});

test('the title, aircraft menu and language switch preserve the live scene', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'This check compares live WebGL node identity.',
  );
  await page.goto('uk/');
  const story = page.locator('[data-story]');
  await expect(story).toHaveAttribute('data-airborne', 'true');
  const canvas = await story.locator('canvas').elementHandle();
  const book = page.locator('.book-chip'),
    before = await book.boundingBox();
  await page.locator('.hero-type abbr').hover();
  await page.waitForTimeout(780);
  expect((await book.boundingBox())?.x).toBe(before?.x);
  expect((await book.boundingBox())?.y).toBe(before?.y);
  const start = await story.getAttribute('data-takeoff');
  await page.locator('[data-model-menu]').click();
  await expect(page.locator('[data-aircraft-option="whoop"]')).toBeDisabled();
  await page.locator('[data-language]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await story.getAttribute('data-takeoff')).toBe(start);
  expect(
    await canvas!.evaluate(
      (n) => document.querySelector('.scene-canvas canvas') === n,
    ),
  ).toBe(true);
  await page.getByRole('switch').click();
  expect(await story.getAttribute('data-takeoff')).toBe(start);
  await page.goBack();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
});
test('the final bookmark starts an optional tour and Escape releases scrolling', async ({
  page,
}) => {
  await page.goto('en/');
  const tour = page.locator('[data-tour]'),
    author = page.locator('[data-author]');
  await expect(author).toBeHidden();
  await page.locator('#before-flight').scrollIntoViewIfNeeded();
  await expect(author).toHaveAttribute(
    'href',
    'https://github.com/AnnaKotl/upTilt',
  );
  await expect(author).toBeVisible();
  await tour.click();
  await expect(tour).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#hero')).toBeInViewport();
  await expect(author).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(tour).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#before-flight').scrollIntoViewIfNeeded();
  await expect(tour).toBeVisible();
});
