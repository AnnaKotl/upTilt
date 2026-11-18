// Localise the static Astro shell in place. Hydrated islands listen to page-language.
const shell = [
  'body > a[href="#main"]',
  '.edge-rail',
  '[data-language]',
  '[data-language] b',
  '[data-language] .hint',
  '[data-model-menu]',
  '[data-model-menu] .hint',
  '[data-aircraft-option]',
  '[data-aircraft-option] .hint',
  '[data-library]',
  '[data-library] .hint',
  '[data-top]',
  '[data-top] .hint',
  '[data-author] .hint',
  '.gate-copy a',
  '.gate-copy h2',
  '.gate-fallback [aria-label]',
  '#kit h2',
  '.kit-list a',
  '.kit-list a > span:last-child',
  '#before-flight h2',
  '#before-flight p',
  '#before-flight a',
  '#before-flight li a span',
  'meta[name="description"]',
];
function capture(doc: Document) {
  return shell.map((selector) =>
    Array.from(doc.querySelectorAll(selector), (node) => ({
      text: node.children.length ? null : node.textContent,
      attributes: ['aria-label', 'href', 'lang', 'hreflang', 'content'].flatMap(
        (name) =>
          node.hasAttribute(name) ? [[name, node.getAttribute(name)!]] : [],
      ),
    })),
  );
}
export function initHomeLanguage() {
  const cache = new Map([[location.pathname, capture(document)]]);
  let version = 0;
  async function switchPage(href: string, push: boolean) {
    const url = new URL(href),
      turn = ++version;
    try {
      let next = cache.get(url.pathname);
      if (!next) {
        const response = await fetch(url.pathname);
        if (!response.ok) throw Error();
        const doc = new DOMParser().parseFromString(
          await response.text(),
          'text/html',
        );
        if (!doc.querySelector('[data-story]')) throw Error();
        next = capture(doc);
        cache.set(url.pathname, next);
      }
      if (turn !== version) return;
      next.forEach((group, i) =>
        document.querySelectorAll(shell[i]).forEach((node, j) => {
          const item = group[j];
          if (!item) return;
          if (item.text !== null) node.textContent = item.text;
          for (const [key, value] of item.attributes)
            node.setAttribute(key, value);
        }),
      );
      document.documentElement.lang = url.pathname.split('/').includes('uk')
        ? 'uk'
        : 'en';
      if (push) history.pushState(null, '', url);
      window.dispatchEvent(new Event('page-language'));
    } catch {
      if (turn === version) location.assign(url);
    }
  }
  window.addEventListener(
    'choose-language',
    (event) => void switchPage((event as CustomEvent<string>).detail, true),
  );
  window.addEventListener('popstate', () => {
    if (!location.pathname.split('/').includes(document.documentElement.lang))
      void switchPage(location.href, false);
  });
}
export function initPresentation() {
  const button = document.querySelector<HTMLButtonElement>('[data-tour]')!;
  const author = document.querySelector<HTMLElement>('[data-author]')!;
  const last = document.getElementById('before-flight')!;
  const stops = [
    'hero',
    'motion',
    'anatomy',
    'radio',
    'display',
    'kit',
    'before-flight',
  ].map((id) => document.getElementById(id)!);
  const dwell = [4100, 3300, 2900, 15000, 8500, 1700, 0];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let atEnd = false,
    playing = false,
    frame = 0;
  function paint() {
    const uk = document.documentElement.lang === 'uk';
    button.hidden = !atEnd && !playing;
    author.hidden = !atEnd;
    button.setAttribute('aria-pressed', String(playing));
    const title = playing
      ? uk
        ? 'Зупинити демонстрацію'
        : 'Stop the tour'
      : uk
        ? 'Візуальна демонстрація'
        : 'Play the guided tour';
    button.setAttribute('aria-label', title);
    button.querySelector('.hint')!.textContent = title;
  }
  const end = new IntersectionObserver(
    ([entry]) => {
      atEnd = entry.isIntersecting;
      paint();
    },
    { threshold: 0.23 },
  );
  end.observe(last);
  paint();
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.revealed = 'true';
          reveal.unobserve(entry.target);
        }
    },
    { threshold: 0.16 },
  );
  reveal.observe(last);
  reveal.observe(stops[5]);
  function stop() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(frame);
    paint();
  }
  function start() {
    playing = true;
    paint();
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.dispatchEvent(new Event('tour-restart'));
    let index = 0,
      time = 0,
      prior = performance.now();
    function tick(now: number) {
      time += Math.min(now - prior, 100);
      prior = now;
      if (document.hidden) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const moving = Math.max(0, time - dwell[index]);
      if (moving > 0) {
        const t = Math.min(1, moving / (reduced.matches ? 1 : 2900));
        const top = (node: HTMLElement) =>
          node.getBoundingClientRect().top + scrollY;
        const ease = t * t * (3 - 2 * t);
        window.scrollTo({
          top: top(stops[index]) * (1 - ease) + top(stops[index + 1]) * ease,
          behavior: 'instant',
        });
        if (t === 1) {
          index++;
          time = 0;
          if (index === stops.length - 1) {
            stop();
            return;
          }
        }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  button.addEventListener('click', () => (playing ? stop() : start()));
  for (const event of ['wheel', 'scene-reset', 'pagehide'])
    window.addEventListener(event, stop, { passive: true });
  window.addEventListener('touchmove', stop, { passive: true });
  document.addEventListener('pointerdown', (e) => {
    if (
      !(e.target as Element).closest(
        '[data-tour], [data-language], [role="switch"]',
      )
    )
      stop();
  });
  document.addEventListener('keydown', (e) => {
    if (
      [
        'Escape',
        'ArrowDown',
        'ArrowUp',
        'Tab',
        'PageDown',
        'PageUp',
        'Home',
        'End',
        ' ',
      ].includes(e.key) &&
      !(e.key === ' ' && e.target === button)
    )
      stop();
  });
  window.addEventListener('page-language', paint);
}
