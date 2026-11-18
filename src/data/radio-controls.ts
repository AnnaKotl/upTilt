// The exhibit animates each physical control independently of radio programming.
export const radioControls = [
  {
    kind: 'switch',
    slot: 0,
    uk: 'Лівий внутрішній перемикач',
    en: 'Left inner switch',
  },
  { kind: 'stick', slot: 0, uk: 'Лівий стік', en: 'Left stick' },
  { kind: 'stick', slot: 1, uk: 'Правий стік', en: 'Right stick' },
  {
    kind: 'switch',
    slot: 1,
    uk: 'Лівий середній перемикач',
    en: 'Left middle switch',
  },
  {
    kind: 'switch',
    slot: 2,
    uk: 'Лівий зовнішній перемикач',
    en: 'Left outer switch',
  },
  {
    kind: 'switch',
    slot: 3,
    uk: 'Правий внутрішній перемикач',
    en: 'Right inner switch',
  },
  {
    kind: 'switch',
    slot: 4,
    uk: 'Правий середній перемикач',
    en: 'Right middle switch',
  },
  {
    kind: 'switch',
    slot: 5,
    uk: 'Правий зовнішній перемикач',
    en: 'Right outer switch',
  },
] as const;
