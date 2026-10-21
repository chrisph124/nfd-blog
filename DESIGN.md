# Design

Notes of Dev is a developer's working notebook: plain, concrete notes on AI, software engineering and developer tools, by Hieu (Chris) Pham.

## Art direction

- **Signature:** the pixel wordmark `<Notes of dev/>` (Bitcount Prop Single). It is the one period cue; nothing else imitates retro styling.
- **Type:** Lora (serif) for display and post titles, Nunito for UI and body text. The contrast axis is serif display against a rounded sans.
- **Accent:** viva magenta on tag pills. Primary blue for links and card titles. Everything else stays neutral.
- **Imagery:** illustrated covers with a paper-grain feel. Covers carry the color; the UI around them stays quiet.
- **Tone:** knowledgeable and calm. Show the thinking (TL;DRs, diagrams, dated notes), not marketing.

## Tokens

All tokens live in `src/app/globals.css`: light values on `:root`, dark values on `[data-theme="dark"]`.

- **Backgrounds:** `--white` `#FAF9F6` (light page) and `--black` `#161616` (dark page). Both are theme-invariant, so they are safe on always-dark or always-light surfaces.
- **Scales that invert in dark mode:** `--gray-*`, `--primary-*`, `--secondary-*` and `--viva-magenta-*`. Exceptions:
  - `--gray-400` keeps the same value in both themes.
  - `--gray-500` has its own dark value (`#9CA3AF`), because the light value is 3.7:1 on `#161616`.
- **Pills:** `bg-viva-magenta-500` turns light pink in dark mode, so pill text is `text-white!` in light mode and `dark:text-black!` in dark mode.
- **Cascade trap:** typography and link rules in `globals.css` (`h1`, `h2`, `.h3`, `a:not(...)`) are unlayered, so they beat Tailwind utilities.
  - Override colors with the important variant (`text-primary-400!`).
  - Size headings with the responsive classes (`display-1`, `.h1` and so on), not `text-*` sizes, which lose.

### Type scale (base / 768 px and up / 1280 px and up)

| Class | Size |
|---|---|
| `display-1` | 30 / 38 / 52 px |
| `h1` | 26 / 28 / 44 px |
| `h2` | 24 / 25 / 34 px |
| `body-1` | 18 / 18 / 19 px |

## Layout and breakpoints

| Breakpoint | Use |
|---|---|
| `min-[360px]` | Header shows up to two flat nav links inline; below it, the menu sheet. |
| `md` 768 | Two-column card grid. |
| `lg` 1024 | Desktop header (inline nav, larger bar). |
| `xl` 1280 | Three-column grid; the hover poster card on hover-capable devices. |

- Content container: `max-w-7xl px-4 md:px-8 lg:px-12 xl:px-5 mx-auto` (1280 px). Pages add no vertical padding of their own: `<main>`'s `py-10` puts every page's content 40 px below the header.
- Prefer named breakpoints. Arbitrary `min-[Npx]:` variants are emitted before named ones, so `md:x` beats `min-[1280px]:x` at wide widths.

## Motion

- **Card reveal:** 0.6 s ease-out fade-up, staggered by 0.12 s per card (`--reveal-i`).
- **First card:** it is the LCP element, so it uses the transform-only `post-card-reveal-lcp`. Never animate opacity on the LCP element.
- **Desktop poster hover:** 0.35 s overlay slide and excerpt reveal, only at `xl` with `(hover: hover)`.
- **Menus:** 0.3 s slide.
- Every animation has a `prefers-reduced-motion` fallback. Content stays visible if animation or JavaScript fails.

## Components

- **Post card (poster):** cover image with overlaid text.
  - Static state (touch devices and below 1280): a stacked card. The full 16:9 cover sits on top and the title, date and excerpt sit on the black panel below it, so text never covers the cover.
  - Desktop hover state: bottom scrim by default, plus a 75% overlay on hover or focus.
  - Dark mode adds a hairline card border.
- **Home masthead:** one visible H1 (`display-1`) and a one-line dek. No other H1 on the page.
- **Post:** pills, H1, a meta line (published date, "Updated" only after a real revision, reading time), cover, excerpt, body. There is no byline or author card: the site has one author, named in structured data and on the About page.
- **Related posts:** at the end of each post, at header and footer width. Three cards (one column below `md`, three from `md`), each card one link. Hover or keyboard focus adds a shadow (a 15% off-white glow in dark mode) and zooms the cover to 105% (no zoom with reduced motion). From 992 px a 128 px 16:9 cover thumbnail sits on the left; it is decorative (`alt=""`) and not loaded below 992 px. RSS lives in the footer and the page head, not on posts. The section heading is an h3 (owner decision) styled like a section h2: `.h2`, `tracking-[inherit]!` and the rose accent (`--rose-700` light, `--rose-500` dark).
- **Footer:** mirrors the header. It has the page background with a 1 px top border (`border-gray-200`), the "notesof.dev" wordmark in the header logo's gradient, `text-gray-500` copyright, and icons in `text-foreground!` that turn `primary-700` on hover, each with a 44 px tap area. No off-palette colors.
- **Theme:** follows the OS until the visitor uses the toggle. The browser bar color matches the page background in both themes.

## Voice

- Plain and concrete. Lead with what the reader gets. No hype words.
- Sentence case. Asides go in parentheses, not dashes.
- Post excerpts are 120–155 characters, so search results show them whole.

## Do and don't

| Do | Don't |
|---|---|
| Check every UI change in light and dark mode. | Assume a gray token inverts; check the dark value. |
| Keep the first card transform-only. | Fade the LCP element in from opacity 0. |
| Use the important variant to beat global rules. | Fight unlayered rules with more specific selectors. |
| Keep tap targets at 44 px on phones. | Ship 28 px icon buttons as the only target. |
| Derive dates from first publish or `updated_on`. | Use Storyblok `published_at` as a modified date. |
