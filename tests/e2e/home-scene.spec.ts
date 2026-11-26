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
  await expect(scene.locator(':scope > header, [data-replay]')).toHaveCount(0);
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
  const header = page.locator('.radio-heading');
  await expect(header).toBeVisible();
  const headingTop = (await header.boundingBox())!.y;
  const parked = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 420);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(parked);
  expect(Math.abs((await header.boundingBox())!.y - headingTop)).toBeLessThan(
    1,
  );
  const radio = page.locator('.radio-study');
  const replay = radio.getByRole('button', { name: 'Повторити демонстрацію' });
  await expect(replay).toHaveCount(0);
  await page
    .locator('#display')
    .evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
  await expect(radio).toHaveAttribute('data-powered', 'false');
  await expect(radio).toHaveAttribute('data-complete', 'false');
  // Leaving the section cuts the demonstration short and rewinds it, so the
  // first pass contributed however many terms it reached before the scroll.
  // Those are not part of the run being measured; start the record clean.
  await sequence.evaluate((terms) => terms.splice(0));
  await page.locator('#radio').evaluate((el) =>
    scrollBy({
      top: el.getBoundingClientRect().top + innerHeight * 0.75,
      behavior: 'instant',
    }),
  );
  await expect.poll(() => sequence.jsonValue()).toContain('ARMED');
  await expect(page.locator('.radio-study')).toHaveAttribute(
    'data-complete',
    'true',
    {
      timeout: 42000,
    },
  );
  const terms = await sequence.jsonValue();
  // One uninterrupted demonstration arms once. More than one arming means it
  // restarted mid-run and the readings below belong to different passes.
  expect(terms.filter((term) => term === 'ARMED')).toHaveLength(1);
  // Powering back on re-announces the resting state before the run begins.
  expect(
    terms.slice(terms.indexOf('ARMED'), terms.indexOf('ARMED') + 4),
  ).toEqual(['ARMED', 'Throttle', 'Pitch', 'Roll']);
  expect(terms).not.toContain('SW');
  expect(terms.at(-1)).toBe('DISARMED');
  await sequence.dispose();
  await page.screenshot({ path: test.info().outputPath('radio.png') });
  const restingY = await page.evaluate(() => scrollY);
  await page.locator('#display').evaluate((el) =>
    scrollBy({
      top: el.getBoundingClientRect().top - innerHeight + 24,
      behavior: 'instant',
    }),
  );
  await expect(replay).toHaveCount(0);
  await expect(radio).toHaveAttribute('data-complete', 'true');
  await page.evaluate(
    (top) => scrollTo({ top, behavior: 'instant' }),
    restingY,
  );
  await expect(replay).toBeVisible();
  await expect(replay).toHaveCSS('cursor', 'pointer');
  const iconWidth = (await replay.boundingBox())!.width;
  await replay.hover();
  await expect
    .poll(async () => (await replay.boundingBox())!.width)
    .toBeGreaterThan(iconWidth + 40);
  await page.mouse.move(5, 5);
  await expect
    .poll(async () => (await replay.boundingBox())!.width)
    .toBeLessThan(iconWidth + 1);
  const stick = page.getByRole('button', { name: 'Правий стік' });
  await stick.hover();
  await expect(page.getByRole('tooltip')).toContainText('Правий стік');
  await expect(page.locator('.radio-study')).toHaveAttribute('data-pose', '3');
  await page
    .getByRole('button', { name: 'Правий зовнішній плечовий перемикач' })
    .focus();
  await expect(page.getByRole('tooltip')).toContainText(
    'Призначення задає профіль моделі',
  );
  await expect(scene).not.toHaveAttribute('data-radio-term', 'SW');
  await radio.getByRole('link').focus();
  await page.keyboard.press('Tab');
  await expect(replay).toBeFocused();
  await expect(replay.locator('.action-label')).toHaveCSS('opacity', '1');
  await replay.press('Enter');
  await expect(replay).toHaveCount(0);
  await expect(radio).toHaveAttribute('data-complete', 'false');
  await expect(scene).toHaveAttribute('data-radio-term', 'ARMED');
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
test.describe('touch radio controls', () => {
  test.use({ hasTouch: true, viewport: { width: 768, height: 1024 } });

  test('a finished demonstration can be replayed by icon in either language', async ({
    page,
  }) => {
    await page.goto('en/#radio');
    const radio = page.locator('.radio-study');
    const repeat = radio.getByRole('button', { name: 'Replay demonstration' });
    await expect(repeat).toHaveCount(0);
    await expect(repeat).toBeVisible({ timeout: 30000 });
    await expect(repeat.locator('.action-label')).toBeHidden();
    await page.locator('[data-language]').tap();
    const translated = radio.getByRole('button', {
      name: 'Повторити демонстрацію',
    });
    await translated.tap();
    await expect(translated).toHaveCount(0);
    await expect(page.locator('[data-story]')).toHaveAttribute(
      'data-radio-term',
      'ARMED',
    );
  });
});

test('section links lead to the matching knowledge topics on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [lang, section, slug, title] of [
    ['uk', 'motion', 'fundamentals', 'Фізика польоту'],
    ['en', 'anatomy', 'anatomy', 'Drone anatomy'],
  ]) {
    await page.goto(lang + '/#' + section);
    const link = page
      .locator('#' + section)
      .getByRole('link', { name: new RegExp(title) });
    await link.click();
    await expect(page).toHaveURL(
      new RegExp(lang + '/knowledge/' + slug + '/$'),
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  }
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
  const book = page.locator('.hero-type .book-chip'),
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
  const selected = page.locator('[data-aircraft-option="whoop"]');
  await expect(selected).toBeDisabled();
  await page.keyboard.press('Tab');
  await expect(selected).toBeFocused();
  await expect(selected.locator('.action-label')).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  await expect(story).toHaveAttribute('data-takeoff', start!);
  await expect(page.locator('[data-model-menu]')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
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
test('the author follows the knowledge bookmark and the tour starts only at the finale', async ({
  page,
}) => {
  await page.goto('en/');
  const tour = page.locator('[data-tour]'),
    author = page.locator('[data-author]'),
    library = page.locator('[data-library]');
  await expect(author).toBeHidden();
  await expect(library).toBeHidden();
  await page.locator('#radio').evaluate((el) => el.scrollIntoView());
  await expect(library).toBeVisible();
  await expect(author).toHaveAttribute(
    'href',
    'https://github.com/AnnaKotl/upTilt',
  );
  await expect(author).toBeVisible();
  await expect(tour).toBeHidden();
  await expect(page.locator('#kit, #before-flight')).toHaveCount(0);
  await page.locator('#display').evaluate((el) => el.scrollIntoView());
  await expect(tour).toBeHidden();
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  );
  await expect(tour).toBeVisible();
  await tour.click();
  await expect(tour).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#hero')).toBeInViewport();
  // Once the reader has reached the radio chapter the credit stays put.
  await expect(author).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tour).toHaveAttribute('aria-pressed', 'false');
  await expect(tour).toBeHidden();
});

test('the full tour finishes at the end of the FPV chapter and can be replayed', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('uk/');
  const tour = page.getByRole('button', { name: 'Повторити демонстрацію' });
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  );
  await tour.click();
  await expect(page.locator('#hero')).toBeInViewport();
  await page.clock.runFor(68_000);
  await expect(page.locator('.goggle-view')).toBeInViewport();
  await expect(tour).toHaveAttribute('aria-pressed', 'false');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight - innerHeight - scrollY,
    ),
  ).toBeLessThanOrEqual(1);
});

test('a full drawing stays in view before the parts mat appears', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Checks the live WebGL transition.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('uk/');
  const scene = page.locator('[data-story]');
  const mat = page.locator('.bench-mat');
  await expect(scene).toHaveAttribute('data-live', 'true');
  const seek = (fraction: number) =>
    page.locator('#motion').evaluate((gate, progress) => {
      const { top, height } = gate.getBoundingClientRect();
      scrollTo({ top: scrollY + top + height * progress, behavior: 'instant' });
    }, fraction);
  await seek(0.72);
  await expect(scene).toHaveCSS('--diagram-opacity', '1');
  await expect(page.locator('.scene-stage .gate-sheet')).toBeHidden();
  await expect(mat).toHaveCSS('opacity', '0');
  await expect(scene).toHaveAttribute('data-board-ready', 'false');
  const start = await page.evaluate(() => scrollY);
  await page.mouse.move(800, 450);
  await page.mouse.wheel(0, 300);
  await expect
    .poll(() => page.evaluate((before) => scrollY - before, start))
    .toBe(138);
  await expect(scene).toHaveCSS('--diagram-opacity', '1');
  await seek(0.93);
  await expect
    .poll(async () =>
      Number(await mat.evaluate((el) => getComputedStyle(el).opacity)),
    )
    .toBeGreaterThan(0.2);
  await expect(scene).toHaveAttribute('data-board-ready', 'false');
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
    const topic = page.locator('#anatomy .mat-topic');
    await expect(topic).toHaveAccessibleName('Будова дрона');
    const topicBox = (await topic.boundingBox())!;
    const rail = (await page.locator('[data-model-menu]').boundingBox())!;
    expect(topicBox.x).toBeGreaterThanOrEqual(rail.x + rail.width);
    expect(topicBox.x + topicBox.width).toBeLessThanOrEqual(mat!.x);
    await topic.click({ trial: true });
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
  const meter = async (selector: string) =>
    Number((await view.locator(selector).textContent())?.match(/[\d.]+/)?.[0]);
  await expect(view.locator('.hud-speed')).toBeEnabled();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect(async () => {
    await scrollToFrame(0.12);
    await expect(view).toHaveAttribute('data-phase', /[1-5]/, { timeout: 800 });
  }).toPass({ timeout: 8000 });
  await expect(view).toHaveAttribute('data-lost', 'false');
  await page.clock.runFor(400);
  const initialVoltage = await meter('.hud-voltage');
  const cruising = await meter('.hud-speed');
  await scrollToFrame(0.55);
  await expect.poll(() => meter('.hud-speed')).toBeGreaterThan(cruising + 3);
  const accelerating = await meter('.hud-voltage');
  expect(initialVoltage - accelerating).toBeLessThan(0.15);
  await page.clock.fastForward(110_000);
  await expect(view.locator('.osd-status')).toHaveText('LOW BATTERY');
  await expect(view.locator('.hud-voltage')).toHaveText(/3\.\d{2} V/);
  const spent = await meter('.hud-charge'),
    beforeLoss = await meter('.hud-voltage');
  await scrollToFrame(0.96);
  await expect(view.locator('.video-noise')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(view).toHaveAttribute('data-lost', 'true');
  await scrollToFrame(0.18);
  await expect(view.locator('.video-noise')).toHaveCSS('opacity', '0');
  expect(await meter('.hud-voltage')).toBeLessThanOrEqual(beforeLoss + 0.1);
  expect(await meter('.hud-charge')).toBeGreaterThanOrEqual(spent);
  await scrollToFrame(0.97);
  await expect(view).toHaveAttribute('data-lost', 'true');
  const parked = await page.evaluate(() => scrollY);
  await page.clock.runFor(1300);
  await expect(view).toHaveAttribute('data-lost', 'false');
  expect(await page.evaluate(() => scrollY)).toBe(parked);
  await expect(view.locator('.hud-time')).toContainText('00:00');
  expect(await meter('.hud-voltage')).toBeGreaterThan(4.3);
  await page.clock.fastForward(240_000);
  await expect(view).toHaveAttribute('data-exhausted', 'true');
  await expect(view.locator('.hud-voltage')).toHaveText(/2\.35 V/);
  await expect(view.locator('.osd-hud')).toBeHidden();
  await page.clock.runFor(1400);
  await expect(view).toHaveAttribute('data-exhausted', 'false');
  await expect(view).toHaveAttribute('data-lost', 'false');
  expect(await meter('.hud-charge')).toBeLessThan(2);
  await page.clock.fastForward(32_000);
  await expect(view).toHaveAttribute('data-lost', 'true');
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  );
  await expect(page.locator('[data-tour]')).toBeVisible();
  const end = await page.evaluate(() => scrollY);
  await page.clock.runFor(1500);
  await expect(view).toHaveAttribute('data-lost', 'false');
  expect(await page.evaluate(() => scrollY)).toBe(end);
});

test('a previous pass can be inspected without motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('uk/#motion');
  const sheet = page.locator('#motion figure');
  const slider = sheet.getByRole('slider');
  await expect(slider).toBeVisible();
  const start = await slider.getAttribute('aria-valuetext');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).not.toHaveAttribute('aria-valuetext', start!);
  const speed = sheet.locator('.measurements b').last();
  const first = await speed.textContent();
  await sheet.getByRole('button', { name: 'Проліт 4' }).click();
  await expect(speed).not.toHaveText(first!);
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('parking at the gate plays the replays before the drawing, and re-arms on return', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'The GPU path is covered in Chromium.');
  await page.goto('en/');
  const story = page.locator('[data-story]');
  await expect(story).toHaveAttribute('data-live', 'true');
  const jump = (id: string) =>
    page.locator(id).evaluate((el) =>
      scrollTo({
        top: scrollY + el.getBoundingClientRect().top,
        behavior: 'instant',
      }),
    );
  const chapter = (fraction: number) =>
    page.locator('#motion').evaluate((gate, p) => {
      const start = scrollY + gate.getBoundingClientRect().top;
      const routes =
        scrollY + document.getElementById('start')!.getBoundingClientRect().top;
      scrollTo({
        top:
          p < 1
            ? routes + (start - routes) * p
            : start + gate.getBoundingClientRect().height * (p - 1),
        behavior: 'instant',
      });
    }, fraction);
  const equation = page.locator('.equation strong');
  const heading = page.locator('#start h2');
  await jump('#start');
  const headingTop = () =>
    heading.evaluate((el) => el.getBoundingClientRect().top);
  const initialHeading = await headingTop();
  await chapter(0.25);
  expect(Math.abs((await headingTop()) - initialHeading)).toBeLessThan(1);
  await expect(heading).toBeInViewport();

  const columns = () =>
    page
      .locator('#start li')
      .evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().left)),
      );
  await chapter(0.48);
  await expect
    .poll(async () => {
      const x = await columns();
      return Math.max(...x) - Math.min(...x);
    })
    .toBeLessThanOrEqual(1);
  await jump('#start');
  await expect
    .poll(async () => (await columns())[2] - (await columns())[0])
    .toBeGreaterThan(600);
  await chapter(0.6);
  await expect(equation).toBeHidden();
  await chapter(0.86);
  await expect(equation).toBeVisible();
  await expect(page.locator('#start li').last()).not.toBeInViewport();
  const approaching = await equation.textContent();
  await chapter(0.94);
  await expect(equation).not.toHaveText(approaching!);
  await expect(page.locator('.scene-stage .gate-sheet')).not.toHaveClass(
    /is-ready/,
  );
  await jump('#motion');
  await expect(story).toHaveAttribute('data-gate-phase', 'replays');
  const lapPanel = page.locator('.lap-controls');
  const colorRow = lapPanel.locator('.lap-swatches');
  const replayPanel = await lapPanel.boundingBox();
  await expect(colorRow).not.toHaveCSS('--lap-index', '0');
  expect(await lapPanel.boundingBox()).toEqual(replayPanel);
  await expect(
    page.getByRole('slider', { name: 'Time since launch' }),
  ).toHaveCount(0);
  await expect(story).toHaveAttribute('data-gate-phase', 'study', {
    timeout: 15000,
  });
  await expect(page.locator('.scene-stage .gate-sheet')).toBeVisible();
  await page.getByRole('button', { name: 'Pass 3' }).click();
  await expect(page.getByRole('button', { name: 'Pass 3' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const slider = page.getByRole('slider', { name: 'Time since launch' });
  const time = await slider.getAttribute('aria-valuetext');
  const station = await page
    .locator('.gate-hit polyline')
    .nth(2)
    .evaluate((line) => {
      const trace = line as unknown as SVGPolylineElement;
      const p = trace.getPointAtLength(trace.getTotalLength() * 0.4);
      const screen = new DOMPoint(p.x, p.y).matrixTransform(
        trace.getScreenCTM()!,
      );
      return { x: screen.x, y: screen.y };
    });
  await page.mouse.move(station.x, station.y);
  await expect(slider).not.toHaveAttribute('aria-valuetext', time!);
  await page.screenshot({ path: test.info().outputPath('gate-study.png') });
  await chapter(1.5);
  await expect(page.locator('.scene-stage .gate-sheet')).not.toHaveClass(
    /is-ready/,
  );
  await expect(equation).toBeHidden();
  const drawingOpacity = () =>
    story.evaluate((el) =>
      Number(el.style.getPropertyValue('--diagram-opacity')),
    );
  await expect.poll(drawingOpacity).toBe(0);
  await chapter(1.63);
  await expect.poll(drawingOpacity).toBeGreaterThan(0);
  await expect(page.locator('.scene-stage .gate-sheet')).toBeHidden();
  await jump('#anatomy');
  await expect(story).toHaveAttribute('data-gate-phase', 'pass');
  await expect(
    page.getByRole('slider', { name: 'Time since launch' }),
  ).toHaveCount(0);
  await jump('#motion');
  await expect(story).toHaveAttribute('data-gate-phase', 'replays');
});
