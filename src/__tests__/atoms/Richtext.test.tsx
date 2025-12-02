import { render } from '@testing-library/react';
import Richtext from '@/components/atoms/Richtext';
import type { RichtextBlok } from '@/types/storyblok';
import type { StoryblokRichTextNode } from '@storyblok/react/rsc';
import type { RichTextNode, RichTextElementNode } from '@/__tests__/types/test-mocks';

// Mock storyblokEditable
vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: <T extends Record<string, unknown>>(blok: T): T & { 'data-blok-cuid': string; 'data-blok-uid': string } => ({
    ...blok,
    'data-blok-cuid': blok._uid as string,
    'data-blok-uid': blok._uid as string,
  }),
  renderRichText: (content: StoryblokRichTextNode<string> | null | undefined): string | null => {
    // Mock different content scenarios
    if (!content) return null;
    if (typeof content === 'object' && content !== null) {
      // Simulate rich text rendering
      return '<p>Mock rich text content</p>';
    }
    return content as string;
  },
}));

describe('Richtext Component', () => {
  const mockBlok: RichtextBlok = {
    _uid: 'test-richtext-1',
    component: 'richtext',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Sample rich text content'
            } as RichTextNode
          ]
        } as RichTextElementNode
      ]
    } as StoryblokRichTextNode<string>,
  };

  describe('Rendering', () => {
    it('renders richtext content when content is provided', () => {
      render(<Richtext blok={mockBlok} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toBeInTheDocument();
      expect(richtextElement).toHaveAttribute('data-blok-cuid', 'test-richtext-1');
    });

    it('renders with correct styling classes', () => {
      render(<Richtext blok={mockBlok} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toHaveClass(
        'flex',
        'flex-col',
        'gap-y-4',
        'richtext',
        'prose',
        'prose-lg',
        'max-w-none'
      );
    });

    it('renders with prose styling classes', () => {
      render(<Richtext blok={mockBlok} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toHaveClass(
        'prose-headings:font-bold',
        'prose-h2:text-3xl',
        'prose-h3:text-2xl',
        'prose-p:text-gray-700',
        'prose-a:text-primary-700',
        'prose-a:no-underline',
        'hover:prose-a:underline',
        'prose-img:rounded-xl',
        'prose-code:bg-gray-100',
        'prose-code:px-2',
        'prose-code:py-1',
        'prose-code:rounded',
        'prose-code:text-sm',
        'prose-code:before:content-none',
        'prose-code:after:content-none'
      );
    });
  });

  describe('Content Handling', () => {
    it('returns null when content is not provided', () => {
      const blokWithoutContent: RichtextBlok = {
        _uid: 'test-richtext-no-content',
        component: 'richtext',
        content: undefined,
      };

      const { container } = render(<Richtext blok={blokWithoutContent} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders empty content when content is empty object', () => {
      const blokWithEmptyContent: RichtextBlok = {
        _uid: 'test-richtext-empty-content',
        component: 'richtext',
        content: {} as StoryblokRichTextNode<string>,
      };

      const { container } = render(<Richtext blok={blokWithEmptyContent} />);
      const richtextElement = container.querySelector('.richtext');
      expect(richtextElement).toBeInTheDocument();
      expect(richtextElement).toHaveAttribute('data-blok-cuid', 'test-richtext-empty-content');
    });

    it('returns null when rendered content is null', () => {
      const blokWithNullContent: RichtextBlok = {
        _uid: 'test-richtext-null-content',
        component: 'richtext',
        content: null,
      };

      const { container } = render(<Richtext blok={blokWithNullContent} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders content when renderRichText returns HTML', () => {
      const blokWithRenderableContent: RichtextBlok = {
        _uid: 'test-richtext-renderable',
        component: 'richtext',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Content that should be rendered'
                } as RichTextNode
              ]
            } as RichTextElementNode
          ]
        } as StoryblokRichTextNode<string>
      };

      render(<Richtext blok={blokWithRenderableContent} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toBeInTheDocument();
      // The component should render with dangerouslySetInnerHTML, but testing the actual HTML content
      expect(richtextElement?.innerHTML).toContain('Mock rich text content');
    });
  });

  describe('Storyblok Integration', () => {
    it('applies storyblokEditable props to the element', () => {
      const customBlok: RichtextBlok = {
        _uid: 'custom-richtext-uid',
        component: 'richtext',
        content: mockBlok.content,
      };

      render(<Richtext blok={customBlok} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toHaveAttribute('data-blok-cuid', 'custom-richtext-uid');
      expect(richtextElement).toHaveAttribute('data-blok-uid', 'custom-richtext-uid');
    });

    it('handles different blok UIDs correctly', () => {
      const anotherBlok: RichtextBlok = {
        _uid: 'another-richtext-uid',
        component: 'richtext',
        content: mockBlok.content,
      };

      render(<Richtext blok={anotherBlok} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toHaveAttribute('data-blok-cuid', 'another-richtext-uid');
    });
  });

  describe('Type Safety', () => {
    it('accepts Readonly props', () => {
      // TypeScript should not complain about readonly props
      const readonlyBlok: Readonly<RichtextBlok> = mockBlok;

      expect(() => render(<Richtext blok={readonlyBlok} />)).not.toThrow();
    });

    it('handles various content structures', () => {
      const complexContentBlok: RichtextBlok = {
        _uid: 'complex-content-richtext',
        component: 'richtext',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [
                {
                  type: 'text',
                  text: 'Heading Text'
                } as RichTextNode
              ]
            } as RichTextElementNode,
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Paragraph with '
                } as RichTextNode,
                {
                  type: 'text',
                  text: 'bold text'
                } as RichTextNode
              ]
            } as RichTextElementNode
          ]
        } as StoryblokRichTextNode<string>
      };

      expect(() => render(<Richtext blok={complexContentBlok} />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles content with special characters', () => {
      const blokWithSpecialChars: RichtextBlok = {
        _uid: 'special-chars-richtext',
        component: 'richtext',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Content with special chars: & < > " \''
                } as RichTextNode
              ]
            } as RichTextElementNode
          ]
        } as StoryblokRichTextNode<string>
      };

      expect(() => render(<Richtext blok={blokWithSpecialChars} />)).not.toThrow();
    });

    it('handles deeply nested content structure', () => {
      const deepNestedBlok: RichtextBlok = {
        _uid: 'deep-nested-richtext',
        component: 'richtext',
        content: {
          type: 'doc',
          content: [
            {
              type: 'bullet_list',
              content: [
                {
                  type: 'list_item',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Nested list item'
                        } as RichTextNode
                      ]
                    } as RichTextElementNode
                  ]
                } as RichTextElementNode
              ]
            } as RichTextElementNode
          ]
        } as StoryblokRichTextNode<string>
      };

      expect(() => render(<Richtext blok={deepNestedBlok} />)).not.toThrow();
    });
  });
});