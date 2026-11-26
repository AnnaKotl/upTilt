import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { repeatedSelectors } from '../../src/lib/stylesheet-rules';

const read = (name: string) => readFileSync(`src/styles/${name}`, 'utf8');

// A selector declared twice in the same context means the later rule silently
// overrides the earlier one, and the real value cannot be read in one place.
// These files were cleared, so they stay clear.
const clean = ['global.css', 'navigation.css', 'knowledge.css'];

// flight-story.css carries the homepage choreography and still has repeats
// whose order the cascade depends on. The count may fall, never rise.
const homepageBudget = 41;

describe('stylesheet hygiene', () => {
  it.each(clean)('%s declares each selector once', (name) => {
    expect(repeatedSelectors(read(name))).toEqual([]);
  });

  it('does not let the homepage accumulate more repeated selectors', () => {
    const repeats = repeatedSelectors(read('flight-story.css'));
    expect(repeats.length).toBeLessThanOrEqual(homepageBudget);
  });

  it('keeps type and tap targets on their tokens', () => {
    const offenders: string[] = [];
    for (const name of readdirSync('src/styles')) {
      if (name === 'fonts.css') continue; // @font-face must name the family.
      // Skip the lines that define the tokens themselves.
      const source = read(name)
        .split('\n')
        .filter((line) => !/^\s*--(tap|font-|row-rule|meta-font)/.test(line))
        .join('\n');
      const literalType = source.match(/'(Play|Press Start 2P)'/g) ?? [];
      const literalTap = source.match(/:\s*44px/g) ?? [];
      if (name !== 'global.css' && literalType.length)
        offenders.push(`${name}: ${literalType.length}x literal family`);
      if (literalTap.length)
        offenders.push(`${name}: ${literalTap.length}x 44px`);
    }
    expect(offenders).toEqual([]);
  });
});
