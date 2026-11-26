// The only list of model stills. `npm run posters` renders exactly these, and
// the components render exactly these themes, so a still cannot be requested
// without existing or be rendered without being shown.
//
// 'dark'   one render, used in both themes (the subject reads the same way).
// 'themed' two renders; the light one replaces it under the light theme.
//
// `tests/unit/posters.test.ts` checks this against public/media/study.

export const posterThemes = ['dark', 'themed'] as const;
export type PosterTheme = (typeof posterThemes)[number];

export const posters = {
  // The two aircraft, whole, plus their front-on kit portraits.
  whoop: 'themed',
  seven: 'themed',
  'kit-whoop': 'themed',
  'kit-seven': 'themed',
  'kit-battery': 'dark',
  'kit-radio': 'dark',
  'kit-goggles': 'dark',

  // Whoop parts, as laid out on the parts board.
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

  // Parts whose 7" counterpart is a different shape and gets its own render.
  'seven-frame': 'themed',
  'seven-canopy': 'themed',
  'seven-antenna': 'themed',
  'seven-esc': 'dark',
  'seven-receiver': 'dark',
  'seven-video': 'dark',

  // The race gate.
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

/** True when a light render exists and should replace the dark one. */
export function isThemed(name: string): boolean {
  return posters[name as PosterName] === 'themed';
}
