import type { Locale } from './i18n';

// Pagefind has no Ukrainian stemmer. Use prefix search for common atlas terms
// and keep technical identifiers and unrecognised words intact.
const ukForms: readonly [RegExp, string][] = [
  [/^частот(?:а|и|і|у|ою|ам|ами|ах)?$/u, 'частот'],
  [/^антен(?:а|и|і|у|ою|ам|ами|ах)?$/u, 'антен'],
  [/^симулятор(?:а|у|і|и|ів|ом|ам|ами|ах)?$/u, 'симулятор'],
  [/^пульт(?:а|у|і|и|ів|ом|ам|ами|ах)?$/u, 'пульт'],
  [/^акумулятор(?:а|у|і|и|ів|ом|ам|ами|ах)?$/u, 'акумулятор'],
];
export function searchTerm(query: string, locale: Locale) {
  const text = query
    .normalize('NFC')
    .toLocaleLowerCase(locale)
    .replace(/[’ʼ']/g, '')
    .trim();
  if (locale !== 'uk') return text;
  return text.replace(
    /\p{Script=Cyrillic}+/gu,
    (word) => ukForms.find(([form]) => form.test(word))?.[1] ?? word,
  );
}
