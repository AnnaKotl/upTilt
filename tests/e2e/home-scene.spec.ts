import { expect, test } from '@playwright/test';

test('one desktop scene follows the gate, parts board and radio in both themes', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'The GPU path is covered in Chromium.');
  test.setTimeout(90000);
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
  const sequence = await scene.evaluateHandle((story) => {
    const terms: string[] = [];
    story.addEventListener('radio-pose', () => {
      const term = story.getAttribute('data-radio-term');
      if (term && term !== terms.at(-1)) terms.push(term);
    });
    return terms;
  });
  for (const id of ['motion', 'anatomy']) {
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
      top: e.getBoundingClientRect().top + scrollY + innerHeight * 0.16,
      behavior: 'instant',
    }),
  );
  const parked = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(parked);
  await expect.poll(() => sequence.jsonValue()).toContain('ARMED');
  await expect(page.locator('.radio-study')).toHaveAttribute(
    'data-complete',
    'true',
    {
      timeout: 42000,
    },
  );
  const terms = await sequence.jsonValue();
  expect(terms.slice(0, 3)).toEqual(['ARMED', 'Pitch', 'Roll']);
  expect(terms.at(-1)).toBe('DISARMED');
  await sequence.dispose();
  await page.screenshot({ path: test.info().outputPath('radio.png') });
  const radio = page.locator('.radio-study');
  await page.locator('#radio').evaluate((el) =>
    scrollBy({
      top: el.getBoundingClientRect().top + innerHeight * 0.75,
      behavior: 'instant',
    }),
  );
  await expect(radio).toHaveAttribute('data-powered', 'false');
  const stick = page.getByRole('button', { name: 'Правий стік' });
  await expect(stick).toBeDisabled();
  await page.getByRole('button', { name: 'Живлення пульта' }).hover();
  await expect(stick).toBeEnabled();
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
  await expect(story).toHaveAttribute('data-airborne', 'true', {
    timeout: 8500,
  });
  const canvas = await story.locator('canvas').elementHandle();
  const book = page.locator('.book-chip'),
    before = await book.boundingBox();
  await expect(page.locator('.fpv-tail').first()).toHaveCSS(
    'clip-path',
    'inset(0px)',
  );
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

test('the moving board is locked and opens a card at the settled battery', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Checks the animated WebGL board.');
  await page.goto('uk/');
  await expect(page.locator('[data-story]')).toHaveAttribute(
    'data-live',
    'true',
  );
  const battery = page.locator('[data-part="battery"]');
  await expect(battery).toBeDisabled();
  await page
    .locator('#anatomy')
    .evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
  await expect(battery).toBeEnabled();
  const anchor = await battery.boundingBox();
  await battery.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Акум');
  const bounds = await dialog.boundingBox();
  expect(anchor!.y + anchor!.height / 2).toBeGreaterThan(bounds!.y);
  expect(anchor!.y + anchor!.height / 2).toBeLessThan(
    bounds!.y + bounds!.height,
  );
  await page.keyboard.press('Escape');
  await expect(battery).toBeFocused();
});

test('both settled layouts keep the names and the opened corner card inside the mat', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Measures the live WebGL board.');
  await page.setViewportSize({ width: 1360, height: 720 });
  await page.goto('uk/');
  await expect(page.locator('[data-story]')).toHaveAttribute(
    'data-live',
    'true',
  );
  for (const model of ['whoop', 'seven']) {
    if (model === 'seven') {
      await page.locator('[data-model-menu]').click();
      await page.locator('[data-aircraft-option="seven"]').click();
    }
    await page.locator('#anatomy').evaluate((el) =>
      scrollTo({
        top:
          scrollY +
          el.getBoundingClientRect().top +
          el.getBoundingClientRect().height * 0.075,
        behavior: 'instant',
      }),
    );
    const buttons = page.locator('.board-part:visible');
    await expect(page.locator('[data-story]')).toHaveAttribute(
      'data-board-ready',
      'true',
    );
    await expect(buttons).toHaveCount(model === 'seven' ? 16 : 13);
    const mat = await page.locator('.bench-mat').boundingBox();
    for (const label of await buttons.locator('.part-label').all()) {
      const box = await label.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(mat!.x);
      expect(box!.y).toBeGreaterThanOrEqual(mat!.y);
      expect(box!.x + box!.width).toBeLessThanOrEqual(mat!.x + mat!.width);
      expect(box!.y + box!.height).toBeLessThanOrEqual(mat!.y + mat!.height);
    }
    await page.locator('[data-part="mounts"]').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.evaluate(async (el) => {
      await Promise.all(el.getAnimations().map((a) => a.finished));
    });
    const card = await dialog.boundingBox();
    expect(card!.x + card!.width).toBeLessThanOrEqual(mat!.x + mat!.width);
    expect(card!.y + card!.height).toBeLessThanOrEqual(mat!.y + mat!.height);
    await page.keyboard.press('Escape');
  }
});

test('the goggle picture recovers when scrolling back and retains the spent charge', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('en/');
  const view = page.locator('.goggle-view');
  const scrollToFrame = async (progress: number) => {
    await page.locator('#display').evaluate(
      (el, p) =>
        scrollTo({
          top:
            scrollY +
            el.getBoundingClientRect().top +
            p * (el.getBoundingClientRect().height - innerHeight),
          behavior: 'instant',
        }),
      progress,
    );
  };
  await scrollToFrame(0.63);
  await expect(view.locator('.osd-status')).toHaveText('LOW BATTERY');
  await expect(view.locator('.hud-voltage')).toHaveText(/3\.\d{2} V/);
  const firstReading = await view.locator('.hud-time').textContent();
  await expect
    .poll(() => view.locator('.hud-time').textContent())
    .not.toBe(firstReading);
  const used = parseInt(await view.locator('.hud-charge').innerText());
  await scrollToFrame(0.95);
  await expect(view.locator('.video-noise')).toHaveCSS('opacity', '1');
  await scrollToFrame(0.18);
  await expect(view.locator('.video-noise')).toHaveCSS('opacity', '0');
  expect(
    parseInt(await view.locator('.hud-charge').innerText()),
  ).toBeGreaterThanOrEqual(used);
  await page.clock.fastForward(120_000);
  await expect(view).toHaveAttribute('data-exhausted', 'true');
  await expect(view.locator('.hud-voltage')).toHaveText(/2\.35 V/);
  await scrollToFrame(0.05);
  await expect(view.locator('.video-noise')).toHaveCSS('opacity', '1');
  await expect(view.locator('.osd-hud')).toBeHidden();
});
