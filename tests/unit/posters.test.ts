import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { posters, isThemed, type PosterName } from '../../src/data/posters';

const directory = 'public/media/study';
const names = Object.keys(posters) as PosterName[];

describe('model still manifest', () => {
  it('has the file every declared still promises', () => {
    const missing = names.flatMap((name) => [
      ...(existsSync(`${directory}/${name}-dark.webp`)
        ? []
        : [`${name}-dark.webp`]),
      ...(!isThemed(name) || existsSync(`${directory}/${name}-light.webp`)
        ? []
        : [`${name}-light.webp`]),
    ]);
    expect(missing).toEqual([]);
  });

  it('declares every still that was rendered', () => {
    const declared = new Set(
      names.flatMap((name) => [
        `${name}-dark.webp`,
        ...(isThemed(name) ? [`${name}-light.webp`] : []),
      ]),
    );
    // Backdrops and textures are authored by hand, not rendered from the model.
    const authored = new Set([
      'forest-lake.webp',
      'lake-day.webp',
      'lake-dusk.webp',
      'video-grain.png',
    ]);
    const stray = readdirSync(directory).filter(
      (file) => !declared.has(file) && !authored.has(file),
    );
    expect(stray).toEqual([]);
  });

  it('marks a light render only where the subject needs one', () => {
    // The themed subjects are the painted surfaces; bare electronics are not.
    expect(names.filter(isThemed).sort()).toEqual([
      'antenna',
      'camera',
      'canopy',
      'frame',
      'kit-seven',
      'kit-whoop',
      'seven',
      'seven-antenna',
      'seven-canopy',
      'seven-frame',
      'whoop',
    ]);
  });
});
