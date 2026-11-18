import { createApp, nextTick, type App } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import ThemeToggle from '../../src/components/preferences/ThemeToggle.vue';
let app: App | undefined;
function mountToggle() {
  const container = document.createElement('div');
  document.body.append(container);
  app = createApp(ThemeToggle, { label: 'Light theme' });
  app.mount(container);
  return container.querySelector('button')!;
}
afterEach(() => {
  app?.unmount();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
});
it('updates theme, accessible state and persisted preference', async () => {
  const button = mountToggle();
  button.click();
  await nextTick();
  expect(button.getAttribute('aria-checked')).toBe('true');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(localStorage.getItem('uptilt:theme')).toBe('light');
});
it('works even when storage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const button = mountToggle();
  button.click();
  await nextTick();
  expect(document.documentElement.dataset.theme).toBe('light');
});
