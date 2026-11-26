// The only list of model stills: `npm run posters` and the components read it.
// 'themed' means a second light render exists. Checked against disk in tests.

export const posterThemes = ['dark', 'themed'] as const;
export type PosterTheme = (typeof posterThemes)[number];

export const posters = {
  whoop: 'themed',
  seven: 'themed',
  'kit-whoop': 'themed',
  'kit-seven': 'themed',
  'kit-battery': 'dark',
  'kit-radio': 'dark',
  'kit-goggles': 'dark',

  frame: 'themed',
  canopy: 'themed',
  camera: 'themed',
  antenna: 'themed',
  motor: 'dark',
  propeller: 'dark',
  board: 'dark',
  battery: 'dark',
  'battery-holder': 'dark',
  'light-strip': 'dark',
  mounts: 'dark',
  connector: 'dark',
  'power-lead': 'dark',

  // 7" counterparts that differ in shape.
  'seven-frame': 'themed',
  'seven-canopy': 'themed',
  'seven-antenna': 'themed',
  'seven-esc': 'dark',
  'seven-receiver': 'dark',
  'seven-video': 'dark',

  gate: 'dark',

  // Transmitter poses: off, neutral, then one per annotated control.
  radio: 'dark',
  'radio-off': 'dark',
  'radio-1': 'dark',
  'radio-2': 'dark',
  'radio-3': 'dark',
  'radio-4': 'dark',
  'radio-5': 'dark',
  'radio-6': 'dark',
  'radio-7': 'dark',
  'radio-8': 'dark',
  'radio-9': 'dark',
  'radio-10': 'dark',
} as const satisfies Record<string, PosterTheme>;

export type PosterName = keyof typeof posters;

export function isThemed(name: string): boolean {
  return posters[name as PosterName] === 'themed';
}
