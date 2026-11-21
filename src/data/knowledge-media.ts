import type { Locale } from '../lib/i18n';

type Localized = Record<Locale, string>;

export interface MediaPreview {
  image: string;
  caption: Localized;
  url: string;
  youtube?: string;
  contained?: boolean;
}

export interface MediaEntry {
  name: string;
  description: Localized;
  links: { label: string | Localized; url: string }[];
  previews: MediaPreview[];
  featured?: boolean;
}

export function youtube(id: string, caption: Localized): MediaPreview {
  return {
    image: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=' + id,
    caption,
    youtube: id,
  };
}
