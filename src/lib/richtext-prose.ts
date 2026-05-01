/**
 * Shared Tailwind class string for the rich-text/markdown content surface.
 * Imported by both `Richtext` and `Markdown` so the rendered HTML carries
 * identical typography regardless of source (Storyblok rich-text or markdown).
 */
export const RICHTEXT_PROSE_CLASSES =
  'w-full flex flex-col gap-y-4 richtext prose prose-lg max-w-none ' +
  'prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl ' +
  'prose-p:text-gray-700 prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline ' +
  'prose-img:rounded-xl ' +
  'prose-code:bg-gray-200 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm ' +
  'prose-code:before:content-none prose-code:after:content-none';
