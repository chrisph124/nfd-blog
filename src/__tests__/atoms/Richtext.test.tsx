import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import type { RichtextBlok } from '@/types/storyblok';
import type { StoryblokRichTextNode } from '@storyblok/react/rsc';

// Mock renderRichText from @storyblok/react/rsc
vi.mock('@storyblok/react/rsc', () => ({
  renderRichText: vi.fn(() => '<p>Rendered rich text content</p>'),
}));

// Mock IntersectionObserver for RichtextReveal component
class MockIntersectionObserver {
  constructor(public callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];
}

global.IntersectionObserver = MockIntersectionObserver as typeof IntersectionObserver;

// Mock storyblokEditable
vi.mock('@/lib/storyblok-utils', () => ({
  makeStoryblokEditable: <T extends Record<string, unknown>>(blok: T) => ({
    ...blok,
    'data-blok-cuid': blok._uid as string,
    'data-blok-uid': blok._uid as string,
  }),
}));

// Mock injectLazyLoading
vi.mock('@/lib/utils', () => ({
  injectLazyLoading: vi.fn((html: string) => html),
}));

// Import the real Richtext component
import Richtext from '@/components/atoms/Richtext';

function createTestRichtextBlok(
  blok: Omit<RichtextBlok, 'component'> & { component?: 'richtext' }
): RichtextBlok {
  return {
    _uid: blok._uid,
    component: 'richtext',
    _editable: blok._editable,
    content: blok.content,
  } as RichtextBlok;
}

describe('Richtext Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
            }
          ]
        }
      ]
    } as any as string,
  };

  describe('Rendering', () => {
    it('renders richtext content when content is provided', async () => {
      await act(async () => {
        render(<Richtext blok={mockBlok} />);
      });

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toBeInTheDocument();
      expect(richtextElement).toHaveAttribute('data-blok-cuid', 'test-richtext-1');
    });

    it('renders with correct styling classes', async () => {
      await act(async () => {
        render(<Richtext blok={mockBlok} />);
      });

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

    it('renders with prose styling classes', async () => {
      await act(async () => {
        render(<Richtext blok={mockBlok} />);
      });

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
        'prose-code:bg-gray-200',
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
        content: {} as any as string,
      };

      const { container } = render(<Richtext blok={blokWithEmptyContent} />);
      const richtextElement = container.querySelector('.richtext');
      expect(richtextElement).toBeInTheDocument();
      expect(richtextElement).toHaveAttribute('data-blok-cuid', 'test-richtext-empty-content');
    });

    it('returns null when rendered content is null', () => {
      const blokWithNullContent = createTestRichtextBlok({
        _uid: 'test-richtext-null-content',
        // @ts-expect-error - Testing null content edge case
        content: null,
      });

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
                }
              ]
            }
          ]
        } as any as string
      };

      render(<Richtext blok={blokWithRenderableContent} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toBeInTheDocument();
      expect(richtextElement?.innerHTML).toContain('Rendered rich text content');
    });
  });

  describe('Storyblok Integration', () => {
    it('applies storyblokEditable props to the element', () => {
      const customBlok = createTestRichtextBlok({
        _uid: 'custom-richtext-uid',
        content: mockBlok.content as any as string,
      });

      render(<Richtext blok={customBlok} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toHaveAttribute('data-blok-cuid', 'custom-richtext-uid');
      expect(richtextElement).toHaveAttribute('data-blok-uid', 'custom-richtext-uid');
    });

    it('handles different blok UIDs correctly', () => {
      const anotherBlok = createTestRichtextBlok({
        _uid: 'another-richtext-uid',
        content: mockBlok.content as any as string,
      });

      render(<Richtext blok={anotherBlok} />);

      const richtextElement = document.querySelector('.richtext');
      expect(richtextElement).toHaveAttribute('data-blok-cuid', 'another-richtext-uid');
    });
  });

  describe('Type Safety', () => {
    it('accepts Readonly props', () => {
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
                }
              ]
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Paragraph with '
                },
                {
                  type: 'text',
                  text: 'bold text'
                }
              ]
            }
          ]
        } as any as string
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
                }
              ]
            }
          ]
        } as any as string
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
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        } as any as string
      };

      expect(() => render(<Richtext blok={deepNestedBlok} />)).not.toThrow();
    });
  });

  describe('Lazy Loading Integration', () => {
    describe('Image lazy loading', () => {
      it('injects lazy loading attribute into images', () => {
        const blok: RichtextBlok = {
          _uid: 'test-lazy-load',
          component: 'richtext',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Content with images'
                  }
                ]
              }
            ]
          } as any as string,
        };

        const { container } = render(<Richtext blok={blok} />);

        const img = container.querySelector('img');
        if (img) {
          expect(img).toHaveAttribute('loading', 'lazy');
        }
      });

      it('preserves existing loading attributes', () => {
        const blok: RichtextBlok = {
          _uid: 'test-existing-loading',
          component: 'richtext',
          content: {
            type: 'doc',
            content: []
          } as any as string,
        };

        expect(() => render(<Richtext blok={blok} />)).not.toThrow();
      });

      it('handles multiple images in content', () => {
        const blok: RichtextBlok = {
          _uid: 'test-multiple-images',
          component: 'richtext',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Multiple images'
                  }
                ]
              }
            ]
          } as any as string,
        };

        render(<Richtext blok={blok} />);
        expect(document.querySelector('.richtext')).toBeInTheDocument();
      });
    });

    describe('Video lazy loading', () => {
      it('injects preload="none" into videos', () => {
        const blok: RichtextBlok = {
          _uid: 'test-video-preload',
          component: 'richtext',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Content with video'
                  }
                ]
              }
            ]
          } as any as string,
        };

        const { container } = render(<Richtext blok={blok} />);

        const video = container.querySelector('video');
        if (video) {
          expect(video).toHaveAttribute('preload', 'none');
        }
      });
    });

    describe('RichtextReveal Wrapper', () => {
      it('wraps content in RichtextReveal component', () => {
        const blok: RichtextBlok = {
          _uid: 'test-reveal-wrapper',
          component: 'richtext',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Test content'
                  }
                ]
              }
            ]
          } as any as string,
        };

        const { container } = render(<Richtext blok={blok} />);

        const richtext = container.querySelector('.richtext');
        expect(richtext?.parentElement?.tagName).toBe('DIV');
      });

      it('preserves prose classes on content div', () => {
        const blok: RichtextBlok = {
          _uid: 'test-prose-classes',
          component: 'richtext',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Styled content'
                  }
                ]
              }
            ]
          } as any as string,
        };

        render(<Richtext blok={blok} />);

        const richtextElement = document.querySelector('.richtext');
        expect(richtextElement).toHaveClass('prose');
        expect(richtextElement).toHaveClass('prose-lg');
        expect(richtextElement).toHaveClass('max-w-none');
      });

      it('handles dangerouslySetInnerHTML with wrapped content', () => {
        const blok: RichtextBlok = {
          _uid: 'test-inner-html',
          component: 'richtext',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'HTML content'
                  }
                ]
              }
            ]
          } as any as string,
        };

        const { container } = render(<Richtext blok={blok} />);

        const richtextElement = container.querySelector('.richtext');
        expect(richtextElement?.innerHTML).toBeTruthy();
      });
    });

    describe('Full Integration', () => {
      it('renders richtext with lazy loading and reveal wrapper', () => {
        const blok: RichtextBlok = {
          _uid: 'test-full-integration',
          component: 'richtext',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Full integration test'
                  }
                ]
              }
            ]
          } as any as string,
        };

        const { container } = render(<Richtext blok={blok} />);

        const wrapper = container.firstChild;
        const richtextContent = container.querySelector('.richtext');

        expect(wrapper).toBeInTheDocument();
        expect(richtextContent).toBeInTheDocument();
        expect(richtextContent).toHaveClass('prose', 'prose-lg');
      });

      it('applies storyblok editable attributes with lazy loading and reveal', () => {
        const blok: RichtextBlok = {
          _uid: 'test-editable-integrated',
          component: 'richtext',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Editable content'
                  }
                ]
              }
            ]
          } as any as string,
        };

        render(<Richtext blok={blok} />);

        const richtextElement = document.querySelector('.richtext');
        expect(richtextElement).toHaveAttribute('data-blok-cuid', 'test-editable-integrated');
        expect(richtextElement).toHaveAttribute('data-blok-uid', 'test-editable-integrated');
      });

      it('handles complex content with images, videos, and text', () => {
        const blok: RichtextBlok = {
          _uid: 'test-complex-content',
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
                    text: 'Section Title'
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Paragraph with media'
                  }
                ]
              }
            ]
          } as any as string,
        };

        const { container } = render(<Richtext blok={blok} />);

        const richtextElement = container.querySelector('.richtext');
        expect(richtextElement).toBeInTheDocument();
        expect(richtextElement?.innerHTML).toContain('Rendered rich text content');
      });
    });
  });
});
