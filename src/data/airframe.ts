// Original visual study of the ducted sport whoop. Positions are in the board viewport.
export const parts = [
  {
    id: 'frame',
    uk: 'Рама',
    en: 'Frame',
    row: 0,
    col: 0,
    scale: 0.48,
    description: {
      uk: 'Чотири захисні кільця з’єднані в одну легку раму. Кожне оточує свій пропелер.',
      en: 'Four guards form a single lightweight frame. Each guard surrounds one propeller.',
    },
  },
  {
    id: 'propeller',
    uk: 'Пропелер',
    en: 'Propeller',
    row: 0,
    col: 1,
    scale: 1.04,
    description: {
      uk: 'Три вигнуті лопаті обертаються разом і штовхають повітря вниз.',
      en: 'Three curved blades turn together and push air down.',
    },
  },
  {
    id: 'motor',
    uk: 'Двигун',
    en: 'Motor',
    row: 0,
    col: 2,
    scale: 2.5,
    description: {
      uk: 'Пропелер сидить на валу двигуна. Під металевим ковпачком видно мідні обмотки.',
      en: 'The propeller sits on the motor shaft. Copper windings are visible beneath the metal bell.',
    },
  },
  {
    id: 'canopy',
    uk: 'Обтічник',
    en: 'Canopy',
    row: 0,
    col: 3,
    scale: 1.42,
    description: {
      uk: 'Дуги обтічника захищають камеру. Між ними видно електроніку.',
      en: 'The canopy arches over the camera. Its open sides leave the electronics in view.',
    },
  },
  {
    id: 'board',
    uk: 'Плата керування',
    en: 'Flight controller',
    row: 1,
    col: 0,
    scale: 1.62,
    description: {
      uk: 'На цій платі містяться датчики та електроніка керування. Тонкі мідні доріжки з’єднують компоненти.',
      en: 'This board carries the sensors and control electronics. Thin copper tracks connect the components.',
    },
  },
  {
    id: 'camera',
    uk: 'Камера FPV',
    en: 'FPV camera',
    row: 1,
    col: 1,
    scale: 2.25,
    description: {
      uk: 'Маленька камера в носовій частині дає вид із борту. Її об’єктив захищає край обтічника.',
      en: 'The small forward-facing camera provides the onboard view. The edge of the canopy helps protect its lens.',
    },
  },
  {
    id: 'antenna',
    uk: 'Антена',
    en: 'Antenna',
    row: 1,
    col: 2,
    scale: 1.65,
    description: {
      uk: 'Тонкий елемент позаду обтічника — антена. Вона є частиною радіосистеми коптера.',
      en: 'The slender element behind the canopy is an antenna. It forms part of the quad’s radio system.',
    },
  },
  {
    id: 'battery',
    uk: 'Акумулятор',
    en: 'Battery',
    row: 1,
    col: 3,
    scale: 1.55,
    description: {
      uk: 'Компактна акумуляторна комірка кріпиться під рамою та живить електроніку й двигуни.',
      en: 'A compact rechargeable cell sits beneath the frame and powers the electronics and motors.',
    },
  },
] as const;
export const boardX = [0.18, 0.395, 0.61, 0.825];
export const boardY = [0.346, 0.647];
