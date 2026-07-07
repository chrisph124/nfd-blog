import { defaultSchema } from 'rehype-sanitize';

/**
 * Shared rehype-sanitize schema — allows the Storyblok content tags the blog
 * uses while keeping strict XSS protection. Both the richtext pipeline and the
 * code_tabs highlighter run CMS-authored HTML through this SAME schema so they
 * share one XSS guarantee (both outputs feed dangerouslySetInnerHTML).
 *
 * Shiki adds its own attributes AFTER sanitize, so only `class` needs allowing
 * on `pre`/`code` here (to preserve the `language-*` hint sanitize would drop).
 */
export const richtextSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img || []), 'loading', 'srcset', 'sizes'],
    iframe: [...(defaultSchema.attributes?.iframe || []), 'loading', 'src', 'allowfullscreen'],
    video: [...(defaultSchema.attributes?.video || []), 'preload', 'src', 'controls'],
    code: [...(defaultSchema.attributes?.code || []), 'class'],
    pre: [...(defaultSchema.attributes?.pre || []), 'class'],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'iframe', 'video', 'source', 'figure', 'figcaption',
  ],
};
