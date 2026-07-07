/**
 * Shared Shiki (via @shikijs/rehype) options — single source of truth for code
 * highlighting across the richtext pipeline and the code_tabs highlighter, so
 * both emit identical dual-theme `pre.shiki` markup.
 *
 * `defaultColor: false` enables CSS-variable mode (`--shiki-light`/`--shiki-dark`)
 * so the existing globals.css light/dark rules apply to both surfaces.
 */
export const shikiRehypeOptions = {
  themes: {
    light: 'one-dark-pro' as const,
    dark: 'one-dark-pro' as const,
  },
  defaultColor: false as const,
};
