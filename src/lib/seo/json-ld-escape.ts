/**
 * Serialise a JSON-LD object for inlining inside a <script type="application/ld+json"> tag.
 *
 * Escapes the `<` character so that any attacker-controlled string in the object cannot break
 * out of the script element via "</script>". The output is still valid JSON-LD because JSON
 * does not require `<` to be escaped — the JSON parser converts < back to `<` on read.
 */
export function escapeJsonLd(json: object): string {
  return JSON.stringify(json).replace(/</g, '\\u003c');
}
