# upTilt

An interactive FPV learning atlas in Ukrainian and English. Desktop first, with a deliberately simpler mobile experience.

## Development

Use Node.js 24 and npm. Install with `npm ci`, then run `npm run dev`.
Open the printed local URL with `/upTilt/uk/` or `/upTilt/en/`.

| Command                | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `npm run check`        | Astro, Vue and TypeScript checks                    |
| `npm test`             | Routing, localization and preference behavior       |
| `npm run build`        | Generate static pages in `dist/`                    |
| `npm run test:e2e`     | Chromium and WebKit browser flows against the build |
| `npm run format:check` | Consistent source formatting                        |

Before the first browser test run: `npx playwright install chromium webkit`.

## Structure

- `src/pages`: statically generated localized routes.
- `src/layouts`: document shell, metadata, preferences bootstrap.
- `src/components`: layout, UI, preferences, knowledge navigation and lazy 3D scene.
- `src/lib`: typed localization, URL and preference helpers.
- `src/data`: structured category records shared across pages.
- `src/styles`: Tailwind entry point, semantic theme tokens and necessary global CSS.
- `tests/unit`, `tests/e2e`: behavior checks at the appropriate level.

Astro builds static Ukrainian and English pages. Vue handles the book, the parts board, the transmitter poses and the OSD readings. The homepage loads a single Three.js scene on larger screens with motion enabled. The same model supplies the transparent WebP stills used on smaller screens and when WebGL is unavailable. The inline source geometry in `src/graphics/specimen.ts` is an original visual interpretation of the [BETAFPV Air65](https://betafpv.com/products/air65-brushless-whoop-quadcopter). The transmitter is an original exterior study of the [RadioMaster TX16S MK3](https://radiomasterrc.com/products/tx16s-mk3-radio-controller). Dusk optics, movement and the lake panorama are illustrative. The scene does not model measured flight dynamics.

Preview a season at `/upTilt/uk/?season=winter` using `winter`, `spring`, `summer` or `autumn`. Remove the parameter to return to the Kyiv calendar. The source override is `seasonPreview` in `src/lib/preferences.ts`. Rebuild model stills with `npm run posters` after installing Playwright Chromium. At the end of the homepage, use the replay bookmark to see the takeoff and follow the guided tour. Escape, manual scrolling or the same bookmark stops it. Dark and light finishes share the same geometry.

Press Start 2P sets the short FPV heading, Play sets the section headings and Manrope sets the body. The main interface takes its accent from the season in Kyiv. The appearance sandbox remains at `/upTilt/uk/design/`.

## Publishing

CI verifies changes. Deployment is a separate manual GitHub Actions workflow. In repository Settings → Pages, choose GitHub Actions before the first deployment. This setup does not publish anything on its own.

The project base is `/upTilt/` (case-sensitive). All localized links and assets must retain it. Root links to Ukrainian and English entry points.

Instructor materials, local planning, session logs and agent instructions are intentionally excluded from Git. No source documents or screenshots are shipped. Public educational content will use verified sources with recorded usage rights.
