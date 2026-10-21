import { describe, it, expect, vi, afterEach } from 'vitest';
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
  FaRss: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} data-testid="rss-icon" />
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
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('renders domain name correctly', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByText('notesof.dev')).toBeInTheDocument();
    });

    it.each([
      ['the first year alone', '2025-06-01T00:00:00Z', '© 2025 Hieu (Chris) Pham'],
      ['a range once the year moves on', '2026-10-06T00:00:00Z', '© 2025–2026 Hieu (Chris) Pham'],
    ])('dates the copyright with %s', (_label, now, expected) => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(now));

      render(<Footer blok={createMockBlok()} />);

      expect(screen.getByRole('contentinfo')).toHaveTextContent(expected);
    });

    it('renders all social media links', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('RSS feed')).toHaveAttribute('href', '/rss.xml');
      expect(screen.getByLabelText('RSS feed')).not.toHaveAttribute('target');
    });

    it('renders icons at correct size (24x24px)', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const githubIcon = screen.getByLabelText('GitHub').querySelector('svg');
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

      const githubLink = screen.getByLabelText('GitHub');
      expect(githubLink).toHaveAttribute('href', 'https://github.com/chrisph124');
    });

    it('adds security attributes to external links', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const githubLink = screen.getByLabelText('GitHub');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('mailto link does not have target or rel', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const emailLink = screen.getByLabelText('Email');
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
      expect(screen.getByText(/Hieu \(Chris\) Pham\. All rights reserved\./)).toBeInTheDocument();
    });

    it('handles undefined copyright', () => {
      const blok = createMockBlok({ copyright: undefined });
      render(<Footer blok={blok} />);

      expect(screen.getByText(/Hieu \(Chris\) Pham\. All rights reserved\./)).toBeInTheDocument();
    });
  });

  describe('Styles', () => {
    it('has full width', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('w-full');
    });

  });

  describe('Responsive Layout', () => {
    it.each([
      { name: 'mobile layout stacks vertically', expectedClass: 'flex-col' },
      { name: 'tablet+ layout uses flex-row', expectedClass: 'md:flex-row' },
      { name: 'tablet+ layout has justify-between', expectedClass: 'md:justify-between' },
    ])('$name', ({ expectedClass }) => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const innerContainer = screen.getByRole('contentinfo').querySelector('div > div');
      expect(innerContainer).toHaveClass(expectedClass);
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

      expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('has transition-colors for smooth hover', () => {
      const blok = createMockBlok();
      render(<Footer blok={blok} />);

      const githubLink = screen.getByLabelText('GitHub');
      expect(githubLink).toHaveClass('transition-colors');
    });
  });
});
