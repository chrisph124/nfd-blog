const ENTITY_MAP: Record<string, string> = {
  '&quot;': '"',
  '&#34;': '"',
  '&apos;': "'",
  '&#x27;': "'",
  '&#39;': "'",
  '&lt;': '<',
  '&#60;': '<',
  '&gt;': '>',
  '&#62;': '>',
  '&amp;': '&',
  '&#38;': '&',
  '&nbsp;': ' ',
  '&#160;': ' ',
};

const ENTITY_PATTERN = /&(?:quot|apos|amp|lt|gt|nbsp|#x27|#34|#39|#60|#62|#38|#160);/gi;

export function stripEntities(input: string | undefined | null): string {
  if (!input) return '';
  return input.replaceAll(ENTITY_PATTERN, (match) => ENTITY_MAP[match.toLowerCase()] ?? match);
}
