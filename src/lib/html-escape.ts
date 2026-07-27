/**
 * Escape HTML metacharacters so untrusted text embeds safely inside a
 * constructed HTML string. Shared by the code_tabs highlighter and the
 * markdown renderer so both escape identically before the sanitize pass.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
