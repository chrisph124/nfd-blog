# Agent guide

Notes of Dev is a Next.js 16 (App Router) blog backed by Storyblok. Start with `README.md` for setup and commands.

## Before you change anything

- **UI work:** read `DESIGN.md` (tokens, type, motion, breakpoints, voice).
- **Review:** follow `REVIEW.md` before you open a pull request, including captures at 1440, 768 and 375 px in both light and dark mode.
- **Next.js:** this version differs from older Next.js. Read the guides in `node_modules/next/dist/docs/` before using an unfamiliar API.

## Commands

| Task | Command |
|---|---|
| Lint | `pnpm lint` |
| Tests | `pnpm test:run` (coverage: `pnpm test:coverage`) |
| Build | `pnpm build` |
| Dev server (draft Storyblok content) | `pnpm dev` |

## Keep these in sync

- **Discovery surfaces:** when routes or content rendering change, update or verify:
  - the sitemap (`src/app/xml-sitemap/route.ts`, served at `/sitemap.xml`);
  - RSS (`src/app/rss.xml/route.ts`);
  - `llms.txt` and `llms-full.txt`;
  - markdown twins (`/{slug}.md` via `src/app/api/md/[slug]/route.ts`);
  - the publish webhook's revalidation list (`src/app/api/revalidate/route.ts`).
- **Dates:** modified dates come from `src/lib/post-dates.ts` (`updated_on`, otherwise first publish). Never use Storyblok `published_at` for them; republishing resets it.
- **Site copy:** the site title, description and topic phrase live in `src/lib/seo/site.ts`.
- **Types:** `src/types/storyblok.ts` is hand-maintained. Do not run `pnpm generate-types` over it without reviewing the diff.

## Safety

- Storyblok Management API writes (schema, stories, publishing) change live content. Back up the story JSON first, and publish only with the owner's approval.
- Never commit `.env*` files or tokens.
