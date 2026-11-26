// Stylesheet walker for the style-hygiene test. Context separates a repeat
// inside a media query from an accidental one.
export interface StyleRule {
  context: string;
  selector: string;
  properties: string[];
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
