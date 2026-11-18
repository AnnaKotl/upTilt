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
