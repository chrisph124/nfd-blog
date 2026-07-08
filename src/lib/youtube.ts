/**
 * Shared YouTube URL helpers. Used by the `media` blok (`Media.tsx`) and the
 * markdown pipeline's lone-URL auto-embed (`richtext-pipeline.ts`) so both
 * recognise the same hosts and extract ids identically.
 */

const YOUTUBE_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
const YOUTUBE_ID_LENGTH = 11;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
]);

/** Extract the 11-char video id from a YouTube URL, or null if none is found. */
export function getYouTubeId(url: string): string | null {
  const match = YOUTUBE_REGEX.exec(url);
  return match?.[2]?.length === YOUTUBE_ID_LENGTH ? match[2] : null;
}

/** True when the URL's host is a known YouTube host. */
export function isYouTubeUrl(url: string): boolean {
  try {
    return YOUTUBE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}
