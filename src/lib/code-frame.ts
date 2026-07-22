/**
 * Build the centered label shown in a code-frame's macOS-terminal header.
 *
 * - filename + language → "filename(language)"  e.g. `hello-world.js(javascript)`
 * - filename only       → "filename"
 * - language only       → "language"            e.g. `markdown`
 * - neither             → "text"
 *
 * The label is shown in its authored case (never uppercased). Shared by the
 * Markdown fence renderer (which knows the `title="…"` filename) and the
 * richtext `rehypeCodeFrame` plugin (which only knows the language), so both
 * surfaces render an identical header.
 */
export function buildCodeLabel(title: string | undefined, language: string): string {
  const file = title?.trim();
  const lang = language.trim();
  if (file) return lang ? `${file}(${lang})` : file;
  return lang || 'text';
}
