import { describe, it, expect } from 'vitest';
import { locales, messages, pageUrl } from '../../src/lib/i18n';
import { topics } from '../../src/data/topics';
describe('static localized navigation', () => {
  it('retains the project prefix without duplicate slashes', () => {
    expect(pageUrl('en', '/knowledge/anatomy/', '/upTilt/')).toBe(
      '/upTilt/en/knowledge/anatomy/',
    );
    expect(pageUrl('uk', '', '/')).toBe('/uk/');
  });
  it('rejects relative traversal', () => {
    expect(() => pageUrl('uk', '../private')).toThrow();
  });
  it('has complete dictionaries and localized categories', () => {
    expect(Object.keys(messages.uk).sort()).toEqual(
      Object.keys(messages.en).sort(),
    );
    expect(new Set(topics.map((t) => t.id)).size).toBe(topics.length);
    for (const locale of locales)
      for (const topic of topics)
        expect(topic.title[locale].length).toBeGreaterThan(0);
  });
});
