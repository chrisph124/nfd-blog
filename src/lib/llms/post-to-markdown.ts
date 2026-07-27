import type {
  AlertBlok,
  CodeTabsBlok,
  ComparisonBlok,
  MarkdownBlok,
  MediaBlok,
  PostBlok,
  RichtextBlok,
  StoryblokStory,
} from '@/types/storyblok';
import type { CodeSample, ExtractedPostContent } from './content-types';
import type { RichtextNode } from './richtext-to-markdown';
import {
  collectRichtextCodeSamples,
  richtextToMarkdown,
  richtextToPlainText,
} from './richtext-to-markdown';
import { codeTabsToCodeSamples, codeTabsToMarkdown } from './code-tabs-to-markdown';
import { AUTHOR_NAME } from '@/lib/seo/author';
import { stripEntities } from '@/lib/seo/strip-entities';
import { isYouTubeUrl } from '@/lib/youtube';

type PostBodyBlok =
  | RichtextBlok
  | MarkdownBlok
  | MediaBlok
  | CodeTabsBlok
  | AlertBlok
  | ComparisonBlok;

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp'];

const hasExtension = (filename: string, extensions: string[]): boolean =>
  extensions.some((ext) => filename.toLowerCase().endsWith(ext));

// ---------------------------------------------------------------------------
// Front matter (YAML-injection safe — RT#3)
// ---------------------------------------------------------------------------

/** Emit a YAML double-quoted scalar: backslashes, quotes and newlines escaped. */
function yamlScalar(value: string): string {
  const escaped = value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', String.raw`\"`)
    // Collapse every line-break variant — CRLF, bare CR, LF — to an escaped \n.
    .replaceAll(/\r\n|\r|\n/g, String.raw`\n`);
  return `"${escaped}"`;
}

export function buildFrontMatter(story: StoryblokStory<PostBlok>, siteUrl: string): string {
  const content = story.content;
  const slug = story.full_slug.replace(/^posts\//, '');
  const datePublished = story.first_published_at || story.created_at;
  const dateModified = story.published_at || datePublished;
  const title = stripEntities(content.title?.trim() || story.name);
  const excerpt = stripEntities(content.excerpt?.trim() || '');
  const tags = (story.tag_list ?? []).map((tag) => yamlScalar(stripEntities(tag)));
  const canonical = `${siteUrl}/${slug}`;

  return [
    '---',
    `title: ${yamlScalar(title)}`,
    `slug: ${yamlScalar(slug)}`,
    `publishedAt: ${yamlScalar(datePublished)}`,
    `dateModified: ${yamlScalar(dateModified)}`,
    `canonical: ${yamlScalar(canonical)}`,
    `author: ${yamlScalar(AUTHOR_NAME)}`,
    `tags: [${tags.join(', ')}]`,
    `excerpt: ${yamlScalar(excerpt)}`,
    '---',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Body serialization
// ---------------------------------------------------------------------------

/** `media` → markdown link/image with no HTML (RT#6 covers the YouTube case). */
function mediaToMarkdown(blok: MediaBlok): string {
  const file = blok.media_file;
  if (!file?.filename) return '';

  const filename = file.filename;
  const title = (file.title || file.alt || 'Media').trim();
  const isExternal = Boolean((file as { is_external_url?: boolean }).is_external_url);

  if (isExternal && isYouTubeUrl(filename)) return `[Video: ${title}](${filename})`;
  if (hasExtension(filename, VIDEO_EXTENSIONS)) return `[Video: ${title}](${filename})`;
  if (hasExtension(filename, IMAGE_EXTENSIONS)) return `![${file.alt || title}](${filename})`;
  return '';
}

function serializeBlok(blok: PostBodyBlok): string {
  switch (blok.component) {
    case 'richtext':
      return richtextToMarkdown(blok.content as unknown as RichtextNode);
    case 'markdown':
      // Already markdown (incl. authored `title="…"` fences) → pass through verbatim.
      return (blok.content ?? '').trim();
    case 'media':
      return mediaToMarkdown(blok);
    case 'code_tabs':
      return codeTabsToMarkdown(blok);
    case 'alert': {
      // TL;DR/callout: body is a richtext field (typed string, object at runtime).
      // Emit its prose as markdown, led by the authored title when present.
      const bodyMd = richtextToMarkdown(blok.body as unknown as RichtextNode).trim();
      if (!bodyMd) return '';
      const title = (blok.title ?? '').trim();
      return title ? `**${title}:** ${bodyMd}` : bodyMd;
    }
    case 'comparison': {
      // Side-by-side cards flatten to sequential prose blocks — each led by its
      // heading — so the comparison reads intact on the AI-legible surface.
      const parts = (blok.columns ?? [])
        .map((card) => {
          const bodyMd = richtextToMarkdown(card.body as unknown as RichtextNode).trim();
          const heading = (card.heading ?? '').trim();
          if (heading && bodyMd) return `**${heading}:** ${bodyMd}`;
          return heading ? `**${heading}**` : bodyMd;
        })
        .filter((part) => part.length > 0);
      if (parts.length === 0) return '';
      const title = (blok.title ?? '').trim();
      const joined = parts.join('\n\n');
      return title ? `**${title}**\n\n${joined}` : joined;
    }
    default: {
      // Compile-time guard: a new body blok type forces a case above. At runtime
      // an unknown component (schema drift) is skipped, never thrown (RT#5).
      const _exhaustive: never = blok;
      return '';
    }
  }
}

/** Serialize a published post story to a self-contained markdown document. */
export function postToMarkdown(
  story: StoryblokStory<PostBlok>,
  options: { siteUrl: string },
): string {
  const frontMatter = buildFrontMatter(story, options.siteUrl);
  const title = stripEntities(story.content.title?.trim() || story.name);
  const body = (story.content.body ?? [])
    .map(serializeBlok)
    .filter((section) => section.length > 0)
    .join('\n\n');

  const sections = [frontMatter, `# ${title}`, body].filter((section) => section.length > 0);
  return `${sections.join('\n\n')}\n`;
}

// ---------------------------------------------------------------------------
// Prose + code extraction (single source of truth for Phase 3 — RT#13)
// ---------------------------------------------------------------------------

/** Strip markdown syntax down to prose plaintext (code fences excluded). */
function markdownToPlainText(markdown: string): string {
  return markdown
    .replaceAll(/```[\s\S]*?```/g, ' ')
    .replaceAll(/~~~[\s\S]*?~~~/g, ' ')
    .replaceAll(/`([^`]*)`/g, '$1')
    .replaceAll(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // eslint-disable-next-line sonarjs/super-linear-regex -- polynomial only on adversarial input; strips links from trusted build-time markdown, and a linear rewrite would change parsing for links whose text/URL contains brackets or parentheses
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/g, '$1') // NOSONAR: see disable note above

    .replaceAll(/^\s{0,3}#{1,6}\s+/gm, '')
    .replaceAll(/^\s{0,3}>\s?/gm, '')
    .replaceAll(/^\s{0,3}[-*+]\s+/gm, '')
    .replaceAll(/^\s{0,3}\d+\.\s+/gm, '')
    .replaceAll(/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '')
    .replaceAll(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replaceAll(/~~([^~]+)~~/g, '$1')
    .replaceAll('\r\n', '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
}

/** Card headings + prose bodies of a comparison, in reading order (no code). */
function extractComparisonProse(blok: ComparisonBlok): string[] {
  const prose: string[] = [];
  const title = (blok.title ?? '').trim();
  if (title) prose.push(title);
  for (const card of blok.columns ?? []) {
    const heading = (card.heading ?? '').trim();
    if (heading) prose.push(heading);
    const text = richtextToPlainText(card.body as unknown as RichtextNode).trim();
    if (text) prose.push(text);
  }
  return prose;
}

/** Prose (plaintext) and code samples contributed by a single body blok. */
function extractBlokContent(blok: PostBodyBlok): ExtractedPostContent {
  switch (blok.component) {
    case 'richtext': {
      const node = blok.content as unknown as RichtextNode;
      const text = richtextToPlainText(node).trim();
      return { prose: text, codeSamples: collectRichtextCodeSamples(node) };
    }
    case 'markdown':
      return { prose: markdownToPlainText(blok.content ?? '').trim(), codeSamples: [] };
    case 'code_tabs':
      return { prose: '', codeSamples: codeTabsToCodeSamples(blok) };
    case 'alert': {
      // TL;DR prose counts toward articleBody/wordCount; a summary carries no
      // code samples (those live in the body bloks).
      const node = blok.body as unknown as RichtextNode;
      return { prose: richtextToPlainText(node).trim(), codeSamples: [] };
    }
    case 'comparison':
      // Card headings + prose bodies count toward articleBody/wordCount; like
      // alert, a comparison carries no code samples (those live in body bloks).
      return { prose: extractComparisonProse(blok).join('\n\n'), codeSamples: [] };
    default:
      // `media` and any unknown component contribute neither prose nor code.
      return { prose: '', codeSamples: [] };
  }
}

/**
 * Single-pass extraction of a post's prose (plaintext) and code samples. Phase 3
 * consumes this so structured-data enrichment never re-walks the body.
 */
export function extractPostContent(
  body: PostBodyBlok[] | undefined | null,
): ExtractedPostContent {
  const proseParts: string[] = [];
  const codeSamples: CodeSample[] = [];

  for (const blok of body ?? []) {
    const { prose, codeSamples: blokCode } = extractBlokContent(blok);
    if (prose) proseParts.push(prose);
    codeSamples.push(...blokCode);
  }

  const prose = stripEntities(proseParts.join('\n\n'))
    // eslint-disable-next-line sonarjs/super-linear-regex -- polynomial only on adversarial input; runs on trusted build-time prose, and a byte-exact linear rewrite isn't expressible with a sonarjs-accepted pattern
    .replaceAll(/[ \t]+\n/g, '\n') // NOSONAR: see disable note above
    .trim();
  return { prose, codeSamples };
}
