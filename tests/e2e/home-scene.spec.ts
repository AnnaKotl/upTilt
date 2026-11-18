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
  await page.getByRole('button', { name: 'Повторити зліт' }).click();
  await expect(page.locator('.scatter')).toHaveClass(/blown/);
  await page.waitForTimeout(700);
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
  await page.getByRole('button', { name: 'Крен', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Крен', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
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
