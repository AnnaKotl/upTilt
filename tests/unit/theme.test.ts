import { afterEach, expect, it, vi } from 'vitest';
import { currentTheme, toggleTheme } from '../../src/lib/preferences';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
});

it('reads the finish the document is wearing', () => {
  expect(currentTheme()).toBe('dark');
  document.documentElement.dataset.theme = 'light';
  expect(currentTheme()).toBe('light');
});

it('switches the finish and persists the choice', () => {
  expect(toggleTheme()).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(localStorage.getItem('uptilt:theme')).toBe('light');
  expect(toggleTheme()).toBe('dark');
  expect(localStorage.getItem('uptilt:theme')).toBe('dark');
});

it('still repaints the page when storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(toggleTheme()).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
});
