/**
 * Minimal stylesheet walker, used by the style-hygiene test. It reports one
 * entry per style rule with the at-rule context it sits in, so a selector that
 * appears twice in the same context can be told apart from the same selector
 * legitimately repeated inside a media query.
 */
export interface StyleRule {
  /** The at-rule preludes this rule nests inside, joined by " | ". */
  context: string;
  /** The selector list, whitespace normalised. */
  selector: string;
  /** Declared property names, in source order. */
  properties: string[];
  /** 1-based line of the opening brace. */
  line: number;
}

export function styleRules(source: string): StyleRule[] {
  const rules: StyleRule[] = [];
  const context: string[] = [];
  let prelude = '';
  let i = 0;

  const blockEnd = (from: number) => {
    let depth = 1;
    let j = from;
    while (depth > 0 && j < source.length) {
      if (source[j] === '{') depth += 1;
      else if (source[j] === '}') depth -= 1;
      j += 1;
    }
    return j;
  };

  while (i < source.length) {
    if (source.startsWith('/*', i)) {
      const close = source.indexOf('*/', i);
      i = close === -1 ? source.length : close + 2;
      continue;
    }
    const character = source[i];
    if (character === '{') {
      const head = prelude.trim().replace(/\s+/g, ' ');
      prelude = '';
      // Conditional groups add context; keyframes are a different language.
      if (head.startsWith('@keyframes')) {
        i = blockEnd(i + 1);
        continue;
      }
      if (head.startsWith('@')) {
        context.push(head);
        i += 1;
        continue;
      }
      const end = blockEnd(i + 1);
      const body = source.slice(i + 1, end - 1);
      rules.push({
        context: context.join(' | '),
        selector: head,
        properties: body
          .split(/;(?![^(]*\))/)
          .map((declaration) => declaration.replace(/\/\*[\s\S]*?\*\//g, ''))
          .filter((declaration) => declaration.includes(':'))
          .map((declaration) => declaration.split(':')[0]!.trim())
          .filter(Boolean),
        line: source.slice(0, i).split('\n').length,
      });
      i = end;
      continue;
    }
    if (character === '}') {
      context.pop();
      prelude = '';
      i += 1;
      continue;
    }
    prelude += character;
    i += 1;
  }
  return rules;
}

/** Selectors declared more than once in the same at-rule context. */
export function repeatedSelectors(source: string): string[] {
  const seen = new Map<string, number>();
  for (const rule of styleRules(source)) {
    const key = `${rule.context}||${rule.selector}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen]
    .filter(([, count]) => count > 1)
    .map(([key]) => key.split('||')[1]!)
    .sort();
}
