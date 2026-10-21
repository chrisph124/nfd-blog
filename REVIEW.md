# Review checklist

Use this for every pull request that changes UI, content rendering or discovery surfaces. Attach screenshots for UI changes.

## Viewports and themes

- [ ] Captures at 1440×900, 768×1024 and 375×812, in **both** light and dark mode, for every changed page.
- [ ] Reflow at 320 px: no horizontal scroll, no clipped or overlapping text.
- [ ] a render check at 375, 768 and 1440 px (for example the AgentKit `render-check.mjs` script, or an equivalent) reports no overflow, clipping or small targets.

## Rubric

Score each area 0–3 with evidence and keep it at 2 or above:

- First impression: what the site is and who writes it, above the fold.
- Brand recall: wordmark, type pair, magenta accent, covers.
- Content punch: plain, concrete headings and excerpts.
- Clarity and hierarchy: one reading path per page.
- Storytelling: posts end with a next step.
- Knowledge and trust: honest dates, an About page, current footer year.
- Motion: purposeful, reduced-motion safe, first card LCP-safe.
- Responsive: recomposed per viewport, 44 px tap targets on phones.
- Accessibility: WCAG 2.2 AA in both themes.
- Performance feel: home stays light (no serialized post bodies), LCP under 2.5 s.

## Accessibility

- [ ] Text contrast at least 4.5:1 (3:1 for large text) in light **and** dark mode. Run a computed contrast scan; do not judge by eye.
- [ ] Every interactive element shows a visible focus indicator when reached by keyboard.
- [ ] One H1 per page; landmarks and accessible names on icon links.

## Discovery surfaces

- [ ] the discovery-surface check (AgentKit `check-discovery-surfaces.mjs <base-url> --site-origin https://www.notesof.dev --sample 10`, or an equivalent) exits 0.
- [ ] A new public route appears in the sitemap (`/xml-sitemap`) and has a canonical. Revalidation (`src/app/api/revalidate/route.ts`) covers it.
- [ ] Post changes keep the markdown twin (`/{slug}.md`), `llms.txt`, `llms-full.txt` and RSS in sync.
- [ ] Modified dates come from `src/lib/post-dates.ts`, never `published_at`.

## Checks

- [ ] `pnpm lint`, `pnpm test:run`, `pnpm test:coverage` and `pnpm build` pass.
- [ ] For layout changes that could affect LCP: before and after Lighthouse with `--throttling-method=devtools` (the simulated mobile mode flips between two values on the same build).
