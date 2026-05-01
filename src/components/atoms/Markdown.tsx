import { marked } from 'marked';
import type { MarkdownBlok } from '@/types/storyblok';
import { processRichtext } from '@/lib/richtext-pipeline';
import { RICHTEXT_PROSE_CLASSES } from '@/lib/richtext-prose';
import RichtextReveal from '@/components/atoms/RichtextReveal';
import CodeBlockEnhancer from '@/components/atoms/CodeBlockEnhancer';

interface MarkdownProps {
  blok: MarkdownBlok;
}

marked.use({ gfm: true, breaks: false });

export default async function Markdown({ blok }: Readonly<MarkdownProps>) {
  if (!blok.content) return null;

  const htmlContent = await marked.parse(blok.content);
  const optimizedContent = await processRichtext(htmlContent);

  return (
    <RichtextReveal>
      <CodeBlockEnhancer>
        <div
          className={RICHTEXT_PROSE_CLASSES}
          dangerouslySetInnerHTML={{ __html: optimizedContent }}
        />
      </CodeBlockEnhancer>
    </RichtextReveal>
  );
}
