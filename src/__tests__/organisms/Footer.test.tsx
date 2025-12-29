import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/organisms/Footer';
import type { SVGProps } from 'react';
import type { FooterBlok } from '@/types/storyblok';

vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'storyblok-editable' })),
}));

vi.mock('react-icons/fa', () => ({
  FaGithub: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} data-testid="github-icon" />
  ),
  FaLinkedin: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} data-testid="linkedin-icon" />
  ),
  FaEnvelope: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} data-testid="envelope-icon" />
  ),
}));

const createMockBlok = (overrides: Partial<FooterBlok> = {}): FooterBlok => ({
  _uid: 'test-uid',
  component: 'footer',
  copyright: '© 2025 Test. All rights reserved.',
  footer_links: [],
  social_media: [],
  ...overrides,
});

describe('Footer', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('renders domain name correctly', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByText('nofan.dev')).toBeInTheDocument();
    });

    it('renders hardcoded copyright text', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByText(/© 2025 Hieu \(Chris\) Pham/)).toBeInTheDocument();
    });

    it('renders all social media links', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByLabelText('GitHub https://github.com/chrisph124')).toBeInTheDocument();
      expect(screen.getByLabelText('LinkedIn https://www.linkedin.com/in/chrispham124/')).toBeInTheDocument();
      expect(screen.getByLabelText('Email mailto:chris.pham124@gmail.com')).toBeInTheDocument();
    });

    it('renders icons at correct size (24x24px)', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const githubIcon = screen.getByLabelText('GitHub https://github.com/chrisph124').querySelector('svg');
      expect(githubIcon).toHaveClass('w-6', 'h-6');
    });

    it('renders with storyblok editable attributes', () => {
      const blok = createMockBlok();
      const { container } = render(<Footer blok={blok} />);

      const footer = container.querySelector('[data-testid="storyblok-editable"]');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Link Attributes', () => {
    it('applies correct href attributes', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const githubLink = screen.getByLabelText('GitHub https://github.com/chrisph124');
      expect(githubLink).toHaveAttribute('href', 'https://github.com/chrisph124');
    });

    it('adds security attributes to external links', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const githubLink = screen.getByLabelText('GitHub https://github.com/chrisph124');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('mailto link does not have target or rel', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const emailLink = screen.getByLabelText('Email mailto:chris.pham124@gmail.com');
      expect(emailLink).toHaveAttribute('href', 'mailto:chris.pham124@gmail.com');
      expect(emailLink).not.toHaveAttribute('target');
      expect(emailLink).not.toHaveAttribute('rel');
    });
  });

  describe('Props Handling', () => {
    it('ignores blok.copyright prop (uses hardcoded text)', () => {
      const blokWithCopyright = {
        ...createMockBlok(),
        copyright: 'Ignored text from CMS',
      };
      render(<Footer blok={blokWithCopyright} />);

      expect(screen.queryByText('Ignored text from CMS')).not.toBeInTheDocument();
      expect(screen.getByText(/© 2025 Hieu \(Chris\) Pham/)).toBeInTheDocument();
    });

    it('handles undefined copyright', () => {
      const blok = createMockBlok({ copyright: undefined });
      render(<Footer blok={blok} />);

      expect(screen.getByText(/© 2025 Hieu \(Chris\) Pham/)).toBeInTheDocument();
    });
  });

  describe('Styles', () => {
    it('has correct background and text colors', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('bg-gray-800', 'text-white');
    });

    it('has full width', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('w-full');
    });

    it('has hover state styles', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const githubLink = screen.getByLabelText('GitHub https://github.com/chrisph124');
      expect(githubLink).toHaveClass('hover:text-primary-400');
    });
  });

  describe('Responsive Layout', () => {
    it('mobile layout stacks vertically', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const innerContainer = screen.getByRole('contentinfo').querySelector('div > div');
      expect(innerContainer).toHaveClass('flex-col');
    });

    it('tablet+ layout uses flex-row', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const innerContainer = screen.getByRole('contentinfo').querySelector('div > div');
      expect(innerContainer).toHaveClass('md:flex-row');
    });

    it('tablet+ layout has justify-between', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const innerContainer = screen.getByRole('contentinfo').querySelector('div > div');
      expect(innerContainer).toHaveClass('md:justify-between');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic footer element', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('has aria-label on social links', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByLabelText('GitHub https://github.com/chrisph124')).toBeInTheDocument();
      expect(screen.getByLabelText('LinkedIn https://www.linkedin.com/in/chrispham124/')).toBeInTheDocument();
      expect(screen.getByLabelText('Email mailto:chris.pham124@gmail.com')).toBeInTheDocument();
    });

    it('has transition-colors for smooth hover', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const githubLink = screen.getByLabelText('GitHub https://github.com/chrisph124');
      expect(githubLink).toHaveClass('transition-colors');
    });
  });
});
