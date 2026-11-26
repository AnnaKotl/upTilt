import { demoDurationMs } from '../data/radio-demo';

// Localise the static Astro shell in place. Hydrated islands listen to page-language.
const shell = [
  'body > a[href="#main"]',
  '.edge-rail',
  '.edge-tab > .action-label > span',
  '.edge-tab > .action-label > small',
  '[data-language]',
  '[data-language] b',
  '[data-model-menu]',
  '[data-aircraft-option]',
  '[data-theme-toggle]',
  '[data-library]',
  '[data-top]',
  '[data-top] .hint',
  '.gate-fallback [aria-label]',
  '#start h2',
  '#start a',
  '#start a strong',
  '#start a span',
  '#start p',
  '#start .search-toggle span',
  '#start form',
  '#start input',
  '#start button',
  '#kit h2',
  '.kit-list a',
  '.kit-list a > span:last-child',
  '#before-flight h2',
  '.preflight-map',
  '.preflight-book .hint',
  '#before-flight a',
  '#before-flight li a span',
  'meta[name="description"]',
];
function capture(doc: Document) {
  return shell.map((selector) =>
    Array.from(doc.querySelectorAll(selector), (node) => ({
      text: node.children.length ? null : node.textContent,
      attributes: [
        'aria-label',
        'href',
        'lang',
        'hreflang',
        'content',
        'action',
      ].flatMap((name) =>
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
  const last = document.querySelector<HTMLElement>('[data-tour-end]')!;
  const stops = ['hero', 'start', 'motion', 'anatomy', 'radio', 'display'].map(
    (id) => document.getElementById(id)!,
  );
  const dwell = [5300, 6800, 12300, 3200, demoDurationMs + 4500, 8500];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stopPosition = (node: HTMLElement) => {
    const live =
      !reduced.matches && document.querySelector('[data-story][data-live]');
    const offset =
      live && node.id === 'motion'
        ? node.offsetHeight * 0.09
        : live && node.id === 'radio'
          ? innerHeight * 0.16
          : 0;
    return node.getBoundingClientRect().top + scrollY + offset;
  };
  const positionAt = (index: number) =>
    index === stops.length
      ? document.documentElement.scrollHeight - innerHeight
      : stopPosition(stops[index]);
  let atEnd = false,
    playing = false,
    frame = 0;
  function paint() {
    const uk = document.documentElement.lang === 'uk';
    button.hidden = !atEnd && !playing;
    button.setAttribute('aria-pressed', String(playing));
    const title = playing
      ? uk
        ? 'Зупинити демонстрацію'
        : 'Stop the tour'
      : uk
        ? 'Повторити демонстрацію'
        : 'Replay the tour';
    button.setAttribute('aria-label', title);
    button.querySelector('.action-label > span')!.textContent = title;
    button.querySelector('.action-label > small')!.textContent = playing
      ? uk
        ? 'Зупинити'
        : 'Stop'
      : uk
        ? 'Повторити'
        : 'Replay';
  }
  const end = new IntersectionObserver(
    ([entry]) => {
      atEnd = entry.intersectionRatio === 1;
      paint();
    },
    { threshold: 1 },
  );
  end.observe(last);
  paint();
  const items = document.querySelectorAll<HTMLElement>('[data-prep-reveal]');
  if (items.length && !reduced.matches) {
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.removeAttribute('data-prep-wait');
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -5% 0px', threshold: 0.1 },
    );
    for (const item of items) {
      if (item.getBoundingClientRect().top > innerHeight)
        item.setAttribute('data-prep-wait', '');
      reveal.observe(item);
    }
  }
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
        const ease = t * t * (3 - 2 * t);
        window.scrollTo({
          top: positionAt(index) * (1 - ease) + positionAt(index + 1) * ease,
          behavior: 'instant',
        });
        if (t === 1) {
          index++;
          time = 0;
          if (index === stops.length) {
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
