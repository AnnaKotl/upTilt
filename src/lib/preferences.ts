export const seasonPreview: 'auto' | 'winter' | 'spring' | 'summer' | 'autumn' =
  'auto';
export const palettes = ['signal', 'copper', 'ice'] as const;
export type Palette = (typeof palettes)[number];
export function validPalette(value: unknown): value is Palette {
  return palettes.some((item) => item === value);
}
export function savePreference(key: string, value: string): void {
  try {
    localStorage.setItem(`uptilt:${key}`, value);
  } catch {
    /* The current page still works when storage is unavailable. */
  }
}

export type Theme = 'dark' | 'light';

/** Read the finish the document is currently wearing. */
export function currentTheme(root = document.documentElement): Theme {
  return root.dataset.theme === 'light' ? 'light' : 'dark';
}

/**
 * Switch the finish, remember it and report the new one. Applying it to the
 * document is what paints the page, so it happens whether storage works or not.
 */
export function toggleTheme(root = document.documentElement): Theme {
  const theme = currentTheme(root) === 'light' ? 'dark' : 'light';
  root.dataset.theme = theme;
  savePreference('theme', theme);
  return theme;
}
