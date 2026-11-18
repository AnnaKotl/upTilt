export const locales = ['uk', 'en'] as const;
export type Locale = (typeof locales)[number];
export const messages = {
  uk: {
    home: 'До початку',
    knowledge: 'База знань',
    design: 'Оформлення',
    skip: 'До вмісту',
    theme: 'Світла тема',
    hero: 'Роздивись. Зрозумій.',
    intro:
      'Будова спортивного FPV-дрона, фізика польоту й короткі пояснення термінів.',
    explore: 'Дослідити будову',
    core: 'Ядро знань',
    coreText: 'Обери напрямок. Кожна деталь має своє місце.',
    back: 'Повернутися',
    soon: 'Матеріали цього розділу готуються.',
    scene: 'Навчальна модель',
    load: 'Розглянути у 3D',
    fallback: 'Схематичний вигляд квадрокоптера',
    simple: 'Спрощений вигляд',
    palette: 'Палітра',
    type: 'Шрифти',
    designText: 'Попередні напрямки оформлення. Вибір можна змінити.',
    author: 'Авторка — Анна Котляр',
  },
  en: {
    home: 'Back to start',
    knowledge: 'Knowledge base',
    design: 'Appearance',
    skip: 'Skip to content',
    theme: 'Light theme',
    hero: 'Explore. Understand.',
    intro:
      'A visual guide to racing quadcopters, flight physics and FPV terminology.',
    explore: 'Explore the anatomy',
    core: 'Knowledge core',
    coreText: 'Choose a path. Every component has its place.',
    back: 'Go back',
    soon: 'Learning materials for this section are being prepared.',
    scene: 'Study model',
    load: 'Explore in 3D',
    fallback: 'Schematic view of a quadcopter',
    simple: 'Simplified view',
    palette: 'Palette',
    type: 'Typography',
    designText: 'Early visual directions. Your selection can be changed.',
    author: 'Created by Anna Kotlyar',
  },
} as const satisfies Record<Locale, Record<string, string>>;
export function t(locale: Locale) {
  return messages[locale];
}
export function pageUrl(
  locale: Locale,
  path = '',
  base = import.meta.env.BASE_URL,
): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  if (clean.split('/').some((segment) => segment === '..' || segment === '.'))
    throw new Error('Invalid route');
  return `${base.replace(/\/+$/, '')}/${locale}/${clean ? `${clean}/` : ''}`;
}
