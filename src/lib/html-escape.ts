/**
 * Escape HTML metacharacters so untrusted text embeds safely inside a
 * constructed HTML string. Shared by the code_tabs highlighter and the
 * markdown renderer so both escape identically before the sanitize pass.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
