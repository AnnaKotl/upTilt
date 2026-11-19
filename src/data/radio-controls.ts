// The exhibit animates each physical control independently of radio programming.
export const radioControls = [
  {
    kind: 'switch',
    slot: 0,
    uk: 'Лівий внутрішній передній перемикач',
    en: 'Left inner front switch',
  },
  { kind: 'stick', slot: 0, uk: 'Лівий стік', en: 'Left stick' },
  { kind: 'stick', slot: 1, uk: 'Правий стік', en: 'Right stick' },
  {
    kind: 'switch',
    slot: 1,
    uk: 'Лівий зовнішній передній перемикач',
    en: 'Left outer front switch',
  },
  {
    kind: 'switch',
    slot: 2,
    uk: 'Лівий внутрішній плечовий перемикач',
    en: 'Left inner shoulder switch',
  },
  {
    kind: 'switch',
    slot: 4,
    uk: 'Правий внутрішній передній перемикач',
    en: 'Right inner front switch',
  },
  {
    kind: 'switch',
    slot: 5,
    uk: 'Правий зовнішній передній перемикач',
    en: 'Right outer front switch',
  },
  {
    kind: 'switch',
    slot: 6,
    uk: 'Правий внутрішній плечовий перемикач',
    en: 'Right inner shoulder switch',
  },
  {
    kind: 'switch',
    slot: 3,
    uk: 'Лівий зовнішній плечовий перемикач',
    en: 'Left outer shoulder switch',
  },
  {
    kind: 'switch',
    slot: 7,
    uk: 'Правий зовнішній плечовий перемикач',
    en: 'Right outer shoulder switch',
  },
] as const;
