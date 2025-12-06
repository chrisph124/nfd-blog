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