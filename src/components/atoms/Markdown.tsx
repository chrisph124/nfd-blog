import { marked } from 'marked';
import type { MarkdownBlok } from '@/types/storyblok';
import { processRichtext } from '@/lib/richtext-pipeline';
import RichtextReveal from '@/components/atoms/RichtextReveal';

interface MarkdownProps {
  blok: MarkdownBlok;
}

const PROSE_CLASSES = "w-full flex flex-col gap-y-4 richtext prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-code:bg-gray-200 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none";

// Configure marked for GFM (GitHub Flavored Markdown) - code blocks, tables, strikethrough
marked.use({
  gfm: true,
  breaks: false,
});

export default async function Markdown({ blok }: Readonly<MarkdownProps>) {
  if (!blok.content) return null;

  // Convert markdown source to HTML, then process through pipeline
  const htmlContent = await marked.parse(blok.content);
  const optimizedContent = await processRichtext(htmlContent);

  return (
    <RichtextReveal>
      <div
        className={PROSE_CLASSES}
        dangerouslySetInnerHTML={{ __html: optimizedContent }}
      />
    </RichtextReveal>
  );
}
