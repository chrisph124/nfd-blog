// Isolated module for storyblokVersion to avoid pulling the full component
// tree into lightweight consumers like the Edge OG-image route.
export const storyblokVersion: 'draft' | 'published' =
  process.env.NODE_ENV === 'development' ? 'draft' : 'published';
