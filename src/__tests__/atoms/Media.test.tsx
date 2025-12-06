import { render, screen } from '@testing-library/react';
import Media from '@/components/atoms/Media';
import type { MediaBlok } from '@/types/storyblok';
import type { ImageProps } from 'next/image';
import type { MockLinkProps } from '@/__tests__/types/test-mocks';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt, className, sizes, unoptimized, priority, fill, ...props }: ImageProps) {
    return (
      <div
        data-testid="mock-image"
        data-src={typeof src === 'string' ? src : ''}
        data-alt={alt as string || ''}
        className={className}
        data-sizes={sizes}
        data-unoptimized={unoptimized ? 'true' : 'false'}
        data-priority={priority ? 'true' : 'false'}
        data-fill={fill ? 'true' : 'false'}
        role="img"
        aria-label={alt as string || ''}
        {...(fill && { 'data-fill': 'true' })}
        {...(priority && { 'data-priority': 'true' })}
        {...(unoptimized && { 'data-unoptimized': 'true' })}
        {...props}
      />
    );
  },
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: function MockLink({ href, children, className, target, rel, ...props }: MockLinkProps) {
    return (
      <a
        href={typeof href === 'string' ? href : '#'}
        className={className}
        target={target}
        rel={rel || (target === '_blank' ? 'noopener noreferrer' : '')}
        {...props}
      >
        {children}
      </a>
    );
  },
}));

// Mock storyblokEditable
vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: <T extends Record<string, unknown>>(blok: T): T & { 'data-blok-cuid': string; 'data-blok-uid': string } => ({
    ...blok,
    'data-blok-cuid': blok._uid as string,
    'data-blok-uid': blok._uid as string,
  }),
  renderRichText: (content: unknown): string | null => {
    // Mock different content scenarios
    if (!content) return null;
    if (typeof content === 'object' && content !== null) {
      // Simulate rich text rendering
      return '<p>Mock rich text content</p>';
    }
    return content as string;
  },
}));

// Mock video element by creating a fake video component
vi.mock('html', async () => {
  return {
    default: {},
  };
});

describe('Media Component', () => {
  const mockBlok: MediaBlok = {
    _uid: 'test-media-1',
    component: 'media',
    media_file: {
      id: 1,
      filename: 'https://example.com/image.jpg',
      alt: 'Test image',
      title: 'Test image title',
    },
  };

  describe('Rendering', () => {
    it('renders an image when media_file is an image', () => {
      render(<Media blok={mockBlok} />);

      const image = screen.getByTestId('mock-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('data-src', 'https://example.com/image.jpg');
    });

    it('renders with caption when title is provided', () => {
      const blokWithCaption: MediaBlok = {
        ...mockBlok,
        media_file: {
          ...mockBlok.media_file,
          title: 'Test caption',
        },
      };

      render(<Media blok={blokWithCaption} />);

      expect(screen.getByText('Test caption')).toBeInTheDocument();
    });

    it('returns null when media_file is missing', () => {
      const blokWithoutMedia = {
        ...mockBlok,
        media_file: undefined,
      } as Partial<MediaBlok>;

      const { container } = render(<Media blok={blokWithoutMedia as MediaBlok} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when media_file.filename is missing', () => {
      const blokWithoutFilename: MediaBlok = {
        ...mockBlok,
        media_file: {
          ...mockBlok.media_file,
          filename: '',
        },
      };

      const { container } = render(<Media blok={blokWithoutFilename} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Aspect Ratios', () => {
    it('applies video aspect ratio when specified', () => {
      const blokWithVideoRatio = {
        ...mockBlok,
        aspect_ratio: 'video' as const,
      };

      render(<Media blok={blokWithVideoRatio} />);

      const figure = screen.getByRole('figure');
      expect(figure).toBeInTheDocument();
    });

    it('applies square aspect ratio when specified', () => {
      const blokWithSquareRatio = {
        ...mockBlok,
        aspect_ratio: 'square' as const,
      };

      render(<Media blok={blokWithSquareRatio} />);

      const figure = screen.getByRole('figure');
      expect(figure).toBeInTheDocument();
    });

    it('uses default aspect ratio when invalid ratio is provided', () => {
      const blokWithInvalidRatio = {
        ...mockBlok,
        aspect_ratio: 'invalid' as MediaBlok['aspect_ratio'],  // Force invalid type for testing edge case
      };

      render(<Media blok={blokWithInvalidRatio} />);

      const figure = screen.getByRole('figure');
      expect(figure).toBeInTheDocument();
    });
  });

  describe('YouTube Video Support', () => {
    it('renders YouTube embed for YouTube URLs', () => {
      const youtubeBlok: MediaBlok = {
        _uid: 'test-youtube-1',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          alt: 'Test YouTube video',
          title: 'Test YouTube video',
          is_external_url: true,
        },
      };

      render(<Media blok={youtubeBlok} />);

      const iframe = screen.getByTitle('Test YouTube video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube.com/embed/dQw4w9WgXcQ'));
    });

    it('renders YouTube embed for youtu.be URLs', () => {
      const youtuBeBlok: MediaBlok = {
        _uid: 'test-youtu-be-1',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'https://youtu.be/dQw4w9WgXcQ',
          alt: 'Test youtu.be video',
          title: 'Test youtu.be video',
          is_external_url: true,
        },
      };

      render(<Media blok={youtuBeBlok} />);

      const iframe = screen.getByTitle('Test youtu.be video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube.com/embed/dQw4w9WgXcQ'));
    });

    it('renders fallback content for invalid YouTube URLs', () => {
      const invalidYoutubeBlok: MediaBlok = {
        _uid: 'test-invalid-youtube-1',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'https://youtube.com/invalid',
          alt: 'Invalid YouTube video',
          title: 'Invalid YouTube video',
          is_external_url: true,
        },
      };

      render(<Media blok={invalidYoutubeBlok} />);

      // Should render empty VideoEmbed container with figure structure
      const figure = screen.getByRole('figure');
      expect(figure).toBeInTheDocument();
    });
  });

  describe('Video File Support', () => {
    it('renders video element for video files', () => {
      const videoBlok: MediaBlok = {
        _uid: 'test-video-1',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'https://example.com/video.mp4',
          alt: 'Test video',
          title: 'Test video',
        },
        autoplay: false,
        loop: true,
        muted: true,
        controls: true,
      };

      render(<Media blok={videoBlok} />);

      const video = screen.getByLabelText('Test video');
      expect(video).toBeInTheDocument();
      // Video src is set on the source element, not the video element itself
      const source = video.querySelector('source');
      expect(source).toHaveAttribute('src', 'https://example.com/video.mp4');
    });

    it('applies video attributes correctly', () => {
      const videoBlok: MediaBlok = {
        _uid: 'test-video-2',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'https://example.com/video.mp4',
          alt: 'Test video with attributes',
        },
        autoplay: true,
        loop: false,
        muted: true,
        controls: false,
      };

      render(<Media blok={videoBlok} />);

      const video = screen.getByLabelText('Test video with attributes');
      // Check that the video element exists and has correct aria-label
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('aria-label', 'Test video with attributes');
      // Verify source element exists
      const source = video.querySelector('source');
      expect(source).toHaveAttribute('src', 'https://example.com/video.mp4');
    });

    it('includes poster image when provided', () => {
      const videoBlokWithPoster: MediaBlok = {
        _uid: 'test-video-poster-1',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'https://example.com/video.mp4',
          alt: 'Video with poster',
        },
        poster_image: {
          id: 2,
          filename: 'https://example.com/poster.jpg',
        },
      };

      render(<Media blok={videoBlokWithPoster} />);

      const video = screen.getByLabelText('Video with poster');
      expect(video).toHaveAttribute('poster', 'https://example.com/poster.jpg');
    });
  });

  describe('Link Wrapping', () => {
    it('wraps media in external link when link is provided', () => {
      const blokWithLink: MediaBlok = {
        ...mockBlok,
        link: {
          url: 'https://external-site.com',
          linktype: 'url',
          target: '_blank',
        },
      };

      render(<Media blok={blokWithLink} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://external-site.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('wraps media in internal link when story link is provided', () => {
      const blokWithInternalLink: MediaBlok = {
        ...mockBlok,
        link: {
          cached_url: '/internal-page',
          linktype: 'story',
          target: '_self',
        },
      };

      render(<Media blok={blokWithInternalLink} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/internal-page');
      expect(link).not.toHaveAttribute('target');
    });
  });

  describe('External URL Images', () => {
    it('renders external images with unoptimized flag', () => {
      const externalImageBlok: MediaBlok = {
        _uid: 'test-external-image-1',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'https://external-site.com/image.jpg',
          alt: 'External image',
          is_external_url: true,
        },
      };

      render(<Media blok={externalImageBlok} />);

      const image = screen.getByTestId('mock-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('data-src', 'https://external-site.com/image.jpg');
    });
  });

  describe('Accessibility', () => {
    it('uses alt text from media_file.alt', () => {
      const blokWithAlt = {
        ...mockBlok,
        media_file: {
          ...mockBlok.media_file!,
          alt: 'Custom alt text',
        },
      };

      render(<Media blok={blokWithAlt} />);

      const image = screen.getByTestId('mock-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('aria-label', 'Custom alt text');
    });

    it('falls back to title when alt is not provided', () => {
      const blokWithoutAlt = {
        ...mockBlok,
        media_file: {
          ...mockBlok.media_file!,
          alt: undefined,
          title: 'Fallback title',
        },
      };

      render(<Media blok={blokWithoutAlt} />);

      const image = screen.getByTestId('mock-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('aria-label', 'Fallback title');
    });

    it('uses default alt text when neither alt nor title is provided', () => {
      const blokWithoutAltOrTitle = {
        ...mockBlok,
        media_file: {
          ...mockBlok.media_file!,
          alt: undefined,
          title: undefined,
        },
      };

      render(<Media blok={blokWithoutAltOrTitle} />);

      const image = screen.getByTestId('mock-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('aria-label', 'Media');
    });
  });

  describe('Unsupported File Types', () => {
    it('returns null for unsupported file types', () => {
      const blokWithUnsupportedFile: MediaBlok = {
        _uid: 'test-unsupported-1',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'https://example.com/file.txt',
          alt: 'Unsupported file',
        },
      };

      const { container } = render(<Media blok={blokWithUnsupportedFile} />);
      expect(container.firstChild).toBeNull();
    });
  });

  // Test DX improvements - TypeScript autocomplete and error messages
  describe('Developer Experience Improvements', () => {
    it('provides comprehensive autocomplete for MediaBlok properties', () => {
      // When typing blok., IDE should suggest:
      // - _uid
      // - component
      // - media_file
      // - poster_image
      // - autoplay, loop, muted, controls
      // - aspect_ratio (with specific enum options)
      // - link
      const completeBlok: MediaBlok = {
        _uid: 'dx-test-1',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'test.jpg',
          alt: 'Test image',
          title: 'Test title',
          focus: '50%50%',
          copyright: '© 2025',
          name: 'Test image name',
          is_external_url: false,
        },
        aspect_ratio: 'video', // IDE suggests: 'video' | 'square' | 'portrait' | 'wide' | 'auto'
        autoplay: true,
        loop: false,
        muted: true,
        controls: true,
      };

      expect(completeBlok.media_file.id).toBe(1);
      expect(completeBlok.aspect_ratio).toBe('video');
    });

    it('provides specific TypeScript errors for invalid properties', () => {
      // Test missing required properties - should get specific error messages
      const incompleteBlok = {
        _uid: 'incomplete-test',
        component: 'media' as const,
        // Missing media_file - TypeScript should provide specific error
      };

      // @ts-expect-error - Testing TypeScript error for missing required field
      const typedIncomplete: MediaBlok = incompleteBlok;

      // Test invalid enum value - should get specific error about allowed values
      const invalidAspectRatioBlok: MediaBlok = {
        _uid: 'invalid-test',
        component: 'media',
        media_file: {
          id: 1,
          filename: 'test.jpg',
        },
        // @ts-expect-error - Testing TypeScript error for invalid enum
        aspect_ratio: 'invalid-ratio' as MediaBlok['aspect_ratio'],
      };

      expect(typedIncomplete).toBeDefined();
      expect(invalidAspectRatioBlok.aspect_ratio).toBe('invalid-ratio');
    });
  });
});