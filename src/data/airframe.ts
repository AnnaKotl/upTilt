// Original visual study of the ducted sport whoop. Positions are in the board viewport.
export const parts = [
  {
    id: 'frame',
    uk: 'Рама',
    en: 'Frame',
    x: 0.18,
    y: 0.205,
    width: 0.26,
    scale: 0.54,
    description: {
      uk: 'Чотири захисні кільця з’єднані в одну легку раму. Кожне оточує свій пропелер.',
      en: 'Four guards form a single lightweight frame. Each guard surrounds one propeller.',
    },
  },
  {
    id: 'propeller',
    uk: 'Пропелер',
    en: 'Propeller',
    x: 0.4,
    y: 0.205,
    width: 0.18,
    scale: 1.16,
    description: {
      uk: 'Три вигнуті лопаті обертаються разом і штовхають повітря вниз.',
      en: 'Three curved blades turn together and push air down.',
    },
  },
  {
    id: 'motor',
    uk: 'Двигун',
    en: 'Motor',
    x: 0.625,
    y: 0.205,
    width: 0.1,
    scale: 2.8,
    description: {
      uk: 'Пропелер сидить на валу двигуна. Під металевим ковпачком видно мідні обмотки.',
      en: 'The propeller sits on the motor shaft. Copper windings are visible beneath the metal bell.',
    },
  },
  {
    id: 'canopy',
    uk: 'Обтічник',
    en: 'Canopy',
    x: 0.84,
    y: 0.205,
    width: 0.19,
    scale: 1.46,
    description: {
      uk: 'Дуги обтічника захищають камеру. Між ними видно електроніку.',
      en: 'The canopy arches over the camera. Its open sides leave the electronics in view.',
    },
  },
  {
    id: 'board',
    uk: 'Плата керування',
    en: 'Flight controller',
    x: 0.17,
    y: 0.49,
    width: 0.2,
    scale: 1.81,
    description: {
      uk: 'На цій платі містяться датчики та електроніка керування. Тонкі мідні доріжки з’єднують компоненти.',
      en: 'This board carries the sensors and control electronics. Thin copper tracks connect the components.',
    },
  },
  {
    id: 'camera',
    uk: 'Камера FPV',
    en: 'FPV camera',
    x: 0.41,
    y: 0.49,
    width: 0.16,
    scale: 2.52,
    description: {
      uk: 'Маленька камера в носовій частині дає вид із борту. Її об’єктив захищає край обтічника.',
      en: 'The small forward-facing camera provides the onboard view. The edge of the canopy helps protect its lens.',
    },
  },
  {
    id: 'antenna',
    uk: 'Антена',
    en: 'Antenna',
    x: 0.855,
    y: 0.49,
    width: 0.16,
    scale: 1.85,
    description: {
      uk: 'Тонкий елемент позаду обтічника — антена. Вона є частиною радіосистеми коптера.',
      en: 'The slender element behind the canopy is an antenna. It forms part of the quad’s radio system.',
    },
  },
  {
    id: 'battery',
    uk: 'Акумулятор',
    en: 'Battery',
    x: 0.65,
    y: 0.49,
    width: 0.18,
    scale: 1.74,
    description: {
      uk: 'Компактна акумуляторна комірка кріпиться під рамою та живить електроніку й двигуни.',
      en: 'A compact rechargeable cell sits beneath the frame and powers the electronics and motors.',
    },
  },
  {
    id: 'light-strip',
    uk: 'Світлодіодна планка',
    en: 'LED strip',
    x: 0.71,
    y: 0.78,
    width: 0.13,
    scale: 2.58,
    description: {
      uk: 'Чотири світлодіоди під переднім краєм рами дають м’який відблиск на поверхні.',
      en: 'Four LEDs under the front edge cast a soft pool of light below the frame.',
    },
  },
  {
    id: 'mounts',
    uk: 'Втулки',
    en: 'Mounting bushes',
    x: 0.87,
    y: 0.78,
    width: 0.11,
    scale: 1.4,
    description: {
      uk: 'Втулки утворюють посадкові місця між корпусом і рамою.',
      en: 'The bushes form mounting seats between the body and the frame.',
    },
  },
  {
    id: 'connector',
    uk: 'Роз’єм живлення',
    en: 'Power connector',
    x: 0.15,
    y: 0.78,
    width: 0.12,
    scale: 2.46,
    description: {
      uk: 'Через цей роз’єм акумулятор з’єднується з електронікою коптера.',
      en: 'This connector links the battery to the electronics.',
    },
  },
  {
    id: 'power-lead',
    uk: 'Провід живлення',
    en: 'Power lead',
    x: 0.33,
    y: 0.78,
    width: 0.11,
    scale: 3.14,
    description: {
      uk: 'Гнучкий провід біля роз’єму живлення.',
      en: 'A flexible wire beside the power connector.',
    },
  },
  {
    id: 'battery-holder',
    uk: 'Тримач акумулятора',
    en: 'Battery retainer',
    x: 0.52,
    y: 0.78,
    width: 0.14,
    scale: 1.4,
    description: {
      uk: 'Дві поперечини під корпусом утримують акумулятор у цій моделі.',
      en: 'Two crosspieces beneath the body hold the battery in this model.',
    },
  },
  {
    id: 'esc',
    uk: 'Регулятор обертів',
    en: 'Speed controller',
    x: 0.2,
    y: 0.35,
    width: 0.16,
    scale: 1.8,
    description: {
      uk: 'На оглядовій схемі це окремий електронний модуль двигунів.',
      en: 'The display shows the motor electronics as a separate module.',
    },
  },
  {
    id: 'receiver',
    uk: 'Радіоприймач',
    en: 'Radio receiver',
    x: 0.46,
    y: 0.35,
    width: 0.15,
    scale: 2.4,
    description: {
      uk: 'Приймач належить до радіоканалу керування.',
      en: 'The receiver belongs to the radio control link.',
    },
  },
  {
    id: 'video',
    uk: 'Відеопередавач',
    en: 'Video transmitter',
    x: 0.7,
    y: 0.35,
    width: 0.16,
    scale: 2.1,
    description: {
      uk: 'Відеопередавач належить до каналу зображення з камери.',
      en: 'The video transmitter belongs to the camera video link.',
    },
  },
] as const;
export type StudyPart = (typeof parts)[number];
export const separateBoards = new Set<string>(['esc', 'receiver', 'video']);
const rows = [
  ['frame', 'propeller', 'motor', 'canopy'],
  ['board', 'esc', 'receiver', 'video'],
  ['camera', 'antenna', 'battery', 'battery-holder'],
  ['connector', 'power-lead', 'light-strip', 'mounts'],
];
export function matPosition(part: StudyPart, openFrame: boolean) {
  if (!openFrame) return part;
  const row = rows.findIndex((ids) => ids.includes(part.id));
  return {
    x: 0.178 + rows[row].indexOf(part.id) * 0.222,
    y: 0.16 + row * 0.217,
  };
}
