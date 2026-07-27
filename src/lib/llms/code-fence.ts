import { ALLOWED_LANGUAGES } from '@/lib/highlight-code';

/**
 * Normalise a CMS-authored language id against the shared Shiki allow-list.
 * Empty → `''` (bare fence); a known id passes through lowercased; anything
 * else collapses to `plaintext` — identical policy to `highlightCode`, so the
 * `.md` fence language matches the rendered tab's highlighted language.
 */
export function normalizeLanguage(raw: string | undefined | null): string {
  const requested = (raw ?? '').trim().toLowerCase();
  if (!requested) return '';
  return ALLOWED_LANGUAGES.has(requested) ? requested : 'plaintext';
}

/**
 * Pick a fence delimiter long enough to wrap `code` losslessly: one backtick
 * longer than the longest backtick run inside it (min 3). Guarantees a code
 * sample that itself contains ``` cannot terminate the fence early, preserving
 * byte-for-byte parity with the rendered block.
 */
export function fenceFor(code: string): string {
  const runs = code.match(/`+/g);
  const longest = runs ? runs.reduce((max, run) => Math.max(max, run.length), 0) : 0;
  return '`'.repeat(Math.max(3, longest + 1));
}

/**
 * Neutralise a filename/label before it enters a fence info-string
 * (`title="…"`). Newlines would break the fence line and unescaped quotes would
 * break the attribute, so both are removed (RT#4 — fence injection).
 */
export function sanitizeFenceMeta(value: string | undefined | null): string {
  return (value ?? '').replaceAll(/[\r\n]+/g, ' ').replaceAll('"', '').trim();
}
