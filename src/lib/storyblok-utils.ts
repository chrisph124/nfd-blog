import { storyblokEditable, renderRichText, StoryblokServerComponent } from '@storyblok/react/rsc';

// Re-export the original functions for convenience
export { storyblokEditable, renderRichText, StoryblokServerComponent };

/**
 * Type-safe wrapper for storyblokEditable function
 * Converts our custom StoryblokBlok types to the expected SbBlokData format
 */
export const makeStoryblokEditable = <T extends { _uid: string; component: string; [key: string]: unknown }>(blok: T) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return storyblokEditable(blok as any);
};

/**
 * Extracts image dimensions from Storyblok CDN URL.
 * Storyblok URL pattern: /f/{space_id}/{width}x{height}/{hash}/{filename}
 *
 * @param url - Storyblok asset URL
 * @returns Object with width and height in pixels
 * @example
 * getDimensionsFromStoryblokUrl("https://a.storyblok.com/f/12345/300x200/hash/img.png")
 * // Returns: { width: 300, height: 200 }
 */
export function getDimensionsFromStoryblokUrl(url: string): {
  width: number;
  height: number;
} {
  const urlParts = url.split('/');
  const dimensionsPart = urlParts[5];

  if (!dimensionsPart?.includes('x')) {
    console.warn(`Invalid Storyblok URL format, using fallback: ${url}`);
    return { width: 1920, height: 1080 };
  }

  const [widthStr, heightStr] = dimensionsPart.split('x');
  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);

  if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
    console.warn(`Invalid dimensions extracted from URL: ${url}`);
    return { width: 1920, height: 1080 };
  }

  return { width, height };
}