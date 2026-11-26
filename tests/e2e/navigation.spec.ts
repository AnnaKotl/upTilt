import { expect, test } from '@playwright/test';

test('desktop bookmarks expand around the label on hover and keyboard focus', async ({
  page,
}) => {
  await page.goto('uk/knowledge/anatomy/');
  for (const control of await page
    .locator('.edge-rail .edge-tab:visible')
    .all()) {
    const label = control.locator('.action-label');
    const closed = (await control.boundingBox())!;
    await expect(label).toHaveCSS('opacity', '0');
    await control.hover();
    await expect(label).toHaveCSS('opacity', '1');
    const open = (await control.boundingBox())!;
    expect(open.width).toBeGreaterThan(closed.width);
    const text = (await label.boundingBox())!;
    expect(text.x + text.width).toBeLessThanOrEqual(open.x + open.width);
    await page.mouse.move(500, 10);
    await expect(label).toHaveCSS('opacity', '0');
    await expect
      .poll(async () => (await control.boundingBox())!.width)
      .toBe(closed.width);
  }
  await page.keyboard.press('Tab');
  await page.getByRole('switch').focus();
  await expect(page.locator('.theme-toggle .action-label')).toHaveCSS(
    'opacity',
    '1',
  );
});

test.describe('touch navigation', () => {
  test.use({ hasTouch: true, reducedMotion: 'reduce' });
  for (const [width, height, dock] of [
    [320, 880, true],
    [844, 390, true],
    [820, 880, false],
  ] as const) {
    test(
      'keeps labels and aircraft choices reachable at width ' + width,
      async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('uk/');
        const rail = page.locator('.edge-rail');
        const box = (await rail.boundingBox())!;
        if (dock) expect(box.y + box.height).toBeCloseTo(height, 0);
        else expect(box.width).toBeLessThan(80);
        for (const name of ['Мова', 'Тема', 'Коптер'])
          await expect(rail.getByText(name, { exact: true })).toBeInViewport();
        const library = rail.locator('[data-library]');
        await expect(library).toBeHidden();
        const picker = rail.locator('[data-model-menu]');
        await picker.tap();
        const frame = rail.locator('[data-aircraft-option="seven"]');
        await expect(frame).toBeInViewport();
        await frame.tap();
        await expect(picker).toHaveAttribute('aria-expanded', 'false');
        await expect(frame).toHaveAttribute('aria-pressed', 'true');
        await rail.locator('[data-language]').tap();
        await expect(rail.getByText('Aircraft', { exact: true })).toBeVisible();
        await page
          .locator('#start')
          .evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
        await expect(library).toBeInViewport();
        if (!dock) {
          const heading = (await page.locator('#start-heading').boundingBox())!;
          expect(heading.x).toBeGreaterThan(box.x + box.width);
        }
        await expect(library.locator('.action-label')).toHaveCSS(
          'opacity',
          '1',
        );
        await expect(page.locator('footer [data-author]')).not.toBeInViewport();
        await library.tap();
        await expect(page).toHaveURL(/en\/knowledge\/$/);
        const search = page.getByRole('button', { name: 'Search' });
        if (dock) await expect(page.locator('main')).toContainText('Search');
        await search.tap();
        await expect(page.getByRole('searchbox')).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(search).toHaveAttribute('aria-expanded', 'false');
      },
    );
  }
});
