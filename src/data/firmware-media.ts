import type { MediaEntry } from './knowledge-media';

const betaflight = 'https://app.betaflight.com/';
const betaflightDocs = 'https://betaflight.com/docs/wiki/app';
const edgetxAssets =
  'https://raw.githubusercontent.com/EdgeTX/edgetx-user-manual/2.12/.gitbook/assets/';

export const firmwareMedia: MediaEntry[] = [
  {
    id: 'betaflight-app',
    name: 'Betaflight App',
    featured: true,
    description: {
      uk: 'Вітальна вкладка та Firmware Flasher у версії 2026.6.2. Для старішої встановленої прошивки звір сумісність у документації перед завантаженням застосунку.',
      en: 'Welcome and Firmware Flasher in version 2026.6.2. Check the documentation for compatibility if your flight controller runs an older firmware release.',
    },
    links: [
      {
        label: { uk: 'Відкрити вебзастосунок', en: 'Open web app' },
        url: betaflight,
      },
      {
        label: { uk: 'Застосунок для ПК', en: 'Desktop downloads' },
        url: 'https://downloads.betaflight.com/',
      },
      {
        label: { uk: 'Документація', en: 'Documentation' },
        url: betaflightDocs,
      },
    ],
    previews: [
      {
        image: 'media/knowledge/betaflight-app-2026.6.2.webp',
        caption: { uk: 'Вітальний екран', en: 'Welcome screen (Ukrainian UI)' },
        url: betaflight,
        contained: true,
      },
      {
        image: 'media/knowledge/betaflight-flasher-2026.6.2.webp',
        caption: {
          uk: 'Firmware Flasher · плата й збірка',
          en: 'Firmware Flasher · board and build (Ukrainian UI)',
        },
        url: betaflightDocs + '/firmware-flasher-tab',
        contained: true,
      },
    ],
  },
  {
    id: 'edgetx-interface',
    name: 'EdgeTX',
    featured: true,
    description: {
      uk: 'Два екрани з посібника EdgeTX 2.12 для пультів із кольоровим дисплеєм. Mixes показує прив’язки до каналів, USB Joystick — інтерфейс обміну з комп’ютером.',
      en: 'Two screens from the EdgeTX 2.12 manual for colour-screen radios. Mixes shows channel assignments. USB Joystick is the interface to the computer.',
    },
    links: [
      { label: 'EdgeTX Buddy', url: 'https://buddy.edgetx.org/' },
      { label: 'EdgeTX Companion', url: 'https://edgetx.org/getedgetx/' },
      {
        label: { uk: 'Документація', en: 'Documentation' },
        url: 'https://manual.edgetx.org/color-radios/model-settings',
      },
    ],
    previews: [
      {
        image: edgetxAssets + 'color_model_mixes.png',
        caption: { uk: 'Model Settings · Mixes', en: 'Model Settings · Mixes' },
        url: 'https://manual.edgetx.org/color-radios/model-settings/inputs-mixes-and-outputs/mixes',
        contained: true,
      },
      {
        image: edgetxAssets + 'usbjoystick1.png',
        caption: {
          uk: 'Model Setup · USB Joystick',
          en: 'Model Setup · USB Joystick',
        },
        url: 'https://manual.edgetx.org/color-radios/model-settings/model-setup/usb-joystick',
        contained: true,
      },
    ],
  },
];

export const inavNote = {
  id: 'inav',
  title: { uk: 'Якщо на платі встановлено INAV', en: 'If the board runs INAV' },
  text: {
    uk: 'INAV має власний настільний Configurator для сумісних плат і версій. За назвою плати та версією прошивки звіряй, який застосунок потрібен саме тобі.',
    en: 'INAV has its own desktop Configurator for compatible boards and firmware versions. Check the board name and firmware version to find the right application.',
  },
  url: 'https://github.com/iNavFlight/inav-configurator/releases',
};
