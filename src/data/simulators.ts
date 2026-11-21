import { youtube, type MediaEntry } from './knowledge-media';

const steam = (id: number) => 'https://store.steampowered.com/app/' + id + '/';
const screenshot = (id: number, file: string) =>
  'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' +
  id +
  '/' +
  file;
const site = { uk: 'Сайт', en: 'Website' };

export const simulators: MediaEntry[] = [
  {
    name: 'Liftoff: FPV Drone Racing',
    featured: true,
    description: {
      uk: 'Перегони та вільний політ. На трасі з воротами зручно повторювати той самий маршрут і порівнювати, наскільки рівно виходять кола.',
      en: 'Racing and free flight. Repeat a gate course to see how consistently you can fly the same line.',
    },
    links: [
      { label: 'Steam', url: steam(410340) },
      {
        label: site,
        url: 'https://www.liftoff-game.com/liftoff-fpv-drone-racing',
      },
    ],
    previews: [
      {
        image: screenshot(
          410340,
          '3c9513aa71c411d50b64b85af61b9ec6d60b0979/ss_3c9513aa71c411d50b64b85af61b9ec6d60b0979.1920x1080.jpg',
        ),
        caption: { uk: 'Кадр із гри', en: 'In-game screenshot' },
        url: steam(410340),
      },
      youtube('VuPwux4hiL4', {
        uk: 'Відео від Liftoff',
        en: 'Video from Liftoff',
      }),
    ],
  },
  {
    name: 'Uncrashed: FPV Drone Simulator',
    featured: true,
    description: {
      uk: 'Вільний політ і редактор оточення. Можна повторювати одну вправу на готовій трасі або розставити власні віртуальні орієнтири.',
      en: 'Free flight and an environment editor. Practise on an existing course or place your own virtual landmarks.',
    },
    links: [
      { label: 'Steam', url: steam(1682970) },
      { label: 'YouTube', url: 'https://www.youtube.com/@Uncrashed_FPV_Sim' },
    ],
    previews: [
      {
        image: screenshot(
          1682970,
          'ss_492f5bcdb4164b7a7b7cf95074c627cc50603a61.1920x1080.jpg',
        ),
        caption: { uk: 'Кадр із гри', en: 'In-game screenshot' },
        url: steam(1682970),
      },
      youtube('FUo5vAgkB3g', {
        uk: 'Редактор трас і середовищ',
        en: 'Track and environment editor',
      }),
    ],
  },
  {
    name: 'Liftoff: Micro Drones',
    description: {
      uk: 'Мікрокоптери й польоти в кімнатах. Зручно тренувати темп і плавні повороти в невеликому просторі.',
      en: 'Micro quads and indoor flying. Practise pacing and smooth turns in small spaces.',
    },
    links: [
      { label: 'Steam', url: steam(1432320) },
      {
        label: site,
        url: 'https://www.liftoff-game.com/our-products/liftoff-micro-drones',
      },
    ],
    previews: [
      youtube('_1y8HDyMUhY', { uk: 'Трейлер релізу', en: 'Launch trailer' }),
    ],
  },
  {
    name: 'FPV SkyDive',
    description: {
      uk: 'Перегони й фристайл. Базова версія безплатна.',
      en: 'Racing and freestyle. The base game is free to play.',
    },
    links: [{ label: 'Steam', url: steam(1278060) }],
    previews: [
      {
        image: screenshot(
          1278060,
          'ss_00a41b66228f5a328db44f729d2665b145981c64.1920x1080.jpg',
        ),
        caption: { uk: 'Кадр із гри', en: 'In-game screenshot' },
        url: steam(1278060),
      },
    ],
  },
  {
    name: 'VelociDrone',
    description: {
      uk: 'Траси, віртуальні ворота й заїзди на час.',
      en: 'Courses, virtual gates and timed laps.',
    },
    links: [{ label: site, url: 'https://www.velocidrone.com/' }],
    previews: [
      youtube('PdE7J1ORO9Y', {
        uk: 'Локація Drift Track',
        en: 'Drift Track scenery',
      }),
    ],
  },
  {
    name: 'FPV Freerider',
    description: {
      uk: 'Польоти від першої особи або із зовнішньої камери. Є демоверсія.',
      en: 'First-person and line-of-sight flight. A demo is available.',
    },
    links: [
      { label: 'itch.io', url: 'https://fpv-freerider.itch.io/fpv-freerider' },
    ],
    previews: [
      youtube('WACcq2ykgNo', { uk: 'Зразок польоту', en: 'Flight preview' }),
    ],
  },
];
