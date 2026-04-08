import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for optimal class name handling
 * - clsx: Handles conditional classes
 * - twMerge: Resolves Tailwind CSS class conflicts
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-blue-500', 'px-6') // 'px-6 py-2 bg-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate estimated reading time for text content
 * Average reading speed: 200-250 words per minute
 *
 * @param text - The text content to analyze
 * @param wordsPerMinute - Reading speed (default: 200)
 * @returns Formatted reading time string (e.g., "5 min read")
 */
export function getReadingTime(text: string, wordsPerMinute: number = 200): string {
  if (!text) return '1 min read';

  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  return `${minutes} min read`;
}

/**
 * Calculate reading time from story body content
 * Extracts text from rich text blocks for accurate reading time calculation
 *
 * @param body - Storyblok body content array
 * @param wordsPerMinute - Reading speed (default: 200)
 * @returns Formatted reading time string (e.g., "5 min read")
 */
export function getStoryReadingTime(body: unknown[] | undefined, wordsPerMinute: number = 200): string {
  if (!body || body.length === 0) return "1 min read";

  // Extract text content from rich text blocks
  const textContent = body.reduce((acc: string, block) => {
    if (typeof block === 'object' && block !== null) {
      const blockObj = block as Record<string, unknown>;
      // Handle rich text content
      if (blockObj.content && Array.isArray(blockObj.content)) {
        return acc + blockObj.content
          .filter((item: unknown) => {
            const itemObj = item as Record<string, unknown>;
            return itemObj.type === 'text';
          })
          .map((item: unknown) => {
            const itemObj = item as Record<string, unknown>;
            return (itemObj.text as string) || '';
          })
          .join(' ');
      }
      // Handle other content types
      return acc + JSON.stringify(block).replaceAll(/[^a-zA-Z\s]/g, ' ');
    }
    return acc;
  }, '');

  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));

  return `${minutes} min read`;
}

/**
 * Format date to readable string
 *
 * @param dateString - ISO date string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string (e.g., "November 23, 2025")
 */
export function formatDate(dateString: string, locale: string = 'en-US'): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Normalize Storyblok URLs to ensure absolute paths for Next.js Link components
 * Prevents relative path issues when navigating from nested routes
 *
 * @param url - URL from Storyblok (cached_url or url field)
 * @returns Absolute path starting with '/' or original URL if external/already absolute
 *
 * @example
 * normalizeStoryblokUrl('about') // '/about'
 * normalizeStoryblokUrl('/about') // '/about'
 * normalizeStoryblokUrl('https://example.com') // 'https://example.com'
 * normalizeStoryblokUrl('') // '#'
 */
export function normalizeStoryblokUrl(url: string | undefined | null): string {
  if (!url) return '#';

  // Return as-is if already external URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
    return url;
  }

  // Return as-is if already absolute path
  if (url.startsWith('/')) {
    return url;
  }

  // Return as-is for special cases
  if (url === '#') {
    return url;
  }

  // Convert relative path to absolute
  return `/${url}`;
}

/**
 * Inject lazy loading attributes into raw HTML for performance optimization
 * - Adds loading="lazy" to <img> and <iframe> tags
 * - Adds preload="none" to <video> tags
 */
export function injectLazyLoading(html: string): string {
  return html
    .replaceAll(/<img(?!\s[^>]*loading=)/gi, '<img loading="lazy"')
    .replaceAll(/<iframe(?!\s[^>]*loading=)/gi, '<iframe loading="lazy"')
    .replaceAll(/<video(?!\s[^>]*preload=)/gi, '<video preload="none"');
}
