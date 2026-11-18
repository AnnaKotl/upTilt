import { test, expect } from '@playwright/test';
test('theme survives reload and a language switch preserves the page', async ({
  page,
}) => {
  await page.goto('uk/knowledge/anatomy/');
  await page.getByRole('switch').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('switch')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL(/\/upTilt\/en\/knowledge\/anatomy\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Drone anatomy',
  );
});
test('the design-study palette persists on the study page', async ({
  page,
}) => {
  await page.goto('en/design/');
  await page.getByRole('button', { name: 'copper', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'copper');
});
test('mobile keeps content usable without a WebGL canvas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('uk/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'База знань' }).click();
  await page.screenshot({
    animations: 'disabled',
    path: test.info().outputPath('mobile.png'),
  });
  await page.getByRole('link', { name: 'Будова дрона', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Будова дрона',
  );
});
test('keyboard can reach the main content', async ({ page, browserName }) => {
  await page.goto('en/');
  // macOS WebKit defaults to Option-Tab for links when full keyboard access is off.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin'
      ? 'Alt+Tab'
      : 'Tab',
  );
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('knowledge pages never request the 3D scene', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('en/knowledge/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(
    requests.some((url) =>
      /StudyScene|SceneGate|flight\.|three\.module/.test(url),
    ),
  ).toBe(false);
});
test('desktop can open and release the lazy 3D scene', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'WebGL availability differs in automated WebKit; fallback is tested separately.',
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('en/design/');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Explore in 3D', exact: true })
    .click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({
    path: 'output/playwright/desktop-3d.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Simplified view', exact: true })
    .click();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('unavailable WebGL retains the readable diagram', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind === 'webgl2') return null;
      return original.call(this, kind as '2d', ...(args as [])) as never;
    } as typeof original;
  });
  await page.goto('en/design/');
  const button = page.getByRole('button', {
    name: 'Explore in 3D',
    exact: true,
  });
  await button.click();
  await expect(button).toBeEnabled();
  await expect(
    page.getByRole('img', { name: 'Schematic view of a quadcopter' }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('book, section bookmarks and search serve different routes', async ({
  page,
}) => {
  await page.goto('en/');
  const book = page.getByRole('button', { name: 'Knowledge base' });
  await expect(page.locator('[data-library]')).toBeHidden();
  await expect(book).toBeEnabled();
  await book.focus();
  await expect(page.locator('#book-branches a').first()).toBeVisible();
  await page.screenshot({
    animations: 'disabled',
    path: test.info().outputPath('hero.png'),
  });
  await expect(page.locator('#book-branches a')).toHaveCount(8);
  await page.keyboard.press('Escape');
  await expect(book).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#anatomy').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-library]')).toBeVisible();
  await page.getByRole('button', { name: 'FPV camera', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('onboard view');
  await page.keyboard.press('Escape');
  await page.locator('[data-library]').click();
  await page.getByRole('searchbox').fill('flight');
  await expect(page.locator('.topic-row:visible')).toHaveCount(1);
  await page.getByRole('link', { name: /Flight physics/ }).click();
  await expect(
    page.getByRole('heading', { name: 'What does a force arrow show?' }),
  ).toBeVisible();
});

test('switching languages keeps the selected part and section', async ({
  page,
}) => {
  await page.goto('uk/');
  await page
    .locator('#anatomy')
    .evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
  await page.getByRole('button', { name: 'Камера FPV' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(
    page.getByRole('button', { name: 'FPV camera', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#anatomy')).toBeInViewport();
  await page.getByRole('button', { name: 'Battery voltage · 3.8 V' }).click();
  await expect(page.getByRole('dialog')).toContainText('volts');
});

test('the detail card returns focus to its trigger', async ({ page }) => {
  await page.goto('en/');
  await page
    .locator('#anatomy')
    .evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
  const details = page.getByRole('button', { name: 'Frame', exact: true });
  await details.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(details).toBeFocused();
});

test('returning to the start skips flight poses and keeps the selected part', async ({
  page,
}) => {
  await page.goto('en/?part=camera');
  await page.locator('#anatomy').scrollIntoViewIfNeeded();
  await page.locator('[data-top]').click();
  await expect(page.locator('#main')).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(
    page.getByRole('button', { name: 'FPV camera', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('reduced motion keeps the introduction static and navigation available', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('en/');
  await expect(page.locator('.scatter')).toBeHidden();
  const book = page.getByRole('button', { name: 'Knowledge base' });
  await book.click();
  await expect(
    page.getByRole('link', { name: 'Radio links', exact: true }),
  ).toBeVisible();
});
