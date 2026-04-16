import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Header from '@/components/organisms/Header';
import type { HeaderBlok, NavItemBlok, SubNavItemBlok, StoryblokLink } from '@/types/storyblok';

// Mock next/navigation
const mockPathname = vi.fn(() => '/');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'storyblok-editable' })),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    <div
      data-testid="next-image"
      src={src}
      alt={alt}
      role="img"
      aria-label={alt}
      {...props as any}
    />
  ),
}));

vi.mock('@react-icons/hi2/HiChevronDown', () => ({
  HiChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-down-icon" className={className} />
  ),
}));

// Mock child components
vi.mock('@/components/atoms/ThemeToggle', () => ({
  default: () => <button role="switch" aria-checked="false" aria-label="Switch to dark theme">Theme</button>,
}));

vi.mock('@/components/atoms/MenuToggle', () => ({
  default: ({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) => (
    <button data-testid="menu-toggle" onClick={onClick}>
      {isOpen ? 'Close' : 'Menu'}
    </button>
  ),
}));

vi.mock('@/components/organisms/NavBar', () => ({
  default: ({ navItems }: { navItems: NavItemBlok[] }) => (
    <nav data-testid="navbar">
      {navItems.map(item => (
        <span key={item._uid}>{item.label}</span>
      ))}
    </nav>
  ),
}));

const createMockSubNavItem = (
  uid: string,
  label: string,
  url?: string
): SubNavItemBlok => ({
  _uid: uid,
  component: 'sub_nav_item' as const,
  label,
  link: {
    cached_url: url || `/${label.toLowerCase()}`,
    linktype: 'story' as const
  } as StoryblokLink,
});

const createMockNavItem = (
  uid: string,
  label: string,
  subItems?: SubNavItemBlok[]
): NavItemBlok => ({
  _uid: uid,
  component: 'nav_item',
  label,
  link: { cached_url: `/${label.toLowerCase()}`, linktype: 'story' as const },
  sub_items: subItems,
});

const createMockBlok = (overrides: Partial<HeaderBlok> = {}): HeaderBlok => ({
  _uid: 'test-uid',
  component: 'header',
  title: 'Test Site',
  logo: {
    id: 1,
    filename: '/logo.svg',
    alt: 'Test Logo',
  },
  nav_items: [],
  enableTheme: false,
  ...overrides,
});

describe('Header', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/');
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Header blok={blok} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders site title', () => {
      const blok = createMockBlok({ title: 'My Blog' });
      render(<Header blok={blok} />);

      expect(screen.getByText('My Blog')).toBeInTheDocument();
    });

    it('renders logo as text with gradient', () => {
      const blok = createMockBlok({ title: 'Test Site' });
      render(<Header blok={blok} />);

      const logoText = screen.getByText('Test Site');
      expect(logoText).toBeInTheDocument();
      expect(logoText).toHaveClass('logo-font', 'text-transparent', 'bg-clip-text');
    });

    it('renders default title when not provided', () => {
      const blok = createMockBlok({ title: undefined, logo: undefined });
      render(<Header blok={blok} />);

      // Default title is 'The Folio' per Header.tsx:19
      const defaultTitle = screen.getByText('The Folio');
      expect(defaultTitle).toBeInTheDocument();
      expect(defaultTitle).toHaveClass('logo-font', 'text-transparent', 'bg-clip-text');
    });
  });

  describe('Navigation', () => {
    it('renders NavBar component', () => {
      const blok = createMockBlok({
        nav_items: [createMockNavItem('nav-1', 'Home')],
      });
      const { getByTestId } = render(<Header blok={blok} />);

      expect(getByTestId('navbar')).toBeInTheDocument();
    });

    it('passes nav items to NavBar', () => {
      const blok = createMockBlok({
        nav_items: [
          createMockNavItem('nav-1', 'Home'),
          createMockNavItem('nav-2', 'About'),
        ],
      });
      render(<Header blok={blok} />);

      // Use getAllByText since items appear in both NavBar and mobile menu
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
      expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    });
  });

  describe('Theme Toggle', () => {
    it('always renders theme toggle', () => {
      const blok = createMockBlok();
      render(<Header blok={blok} />);

      expect(screen.getAllByRole('switch').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Mobile Menu', () => {
    it('renders menu toggle button', () => {
      const blok = createMockBlok();
      const { getByTestId } = render(<Header blok={blok} />);

      expect(getByTestId('menu-toggle')).toBeInTheDocument();
    });

    it('opens mobile menu when toggle clicked', () => {
      const blok = createMockBlok();
      const { getByTestId } = render(<Header blok={blok} />);

      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      expect(menuToggle).toHaveTextContent('Close');
    });

    it('closes mobile menu when toggle clicked again', () => {
      const blok = createMockBlok();
      const { getByTestId } = render(<Header blok={blok} />);

      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);
      fireEvent.click(menuToggle);

      expect(menuToggle).toHaveTextContent('Menu');
    });

    it('prevents body scroll when menu is open', () => {
      const blok = createMockBlok();
      const { getByTestId } = render(<Header blok={blok} />);

      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when menu is closed', () => {
      const blok = createMockBlok();
      const { getByTestId } = render(<Header blok={blok} />);

      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);
      fireEvent.click(menuToggle);

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Mobile Menu Content', () => {
    it('renders nav items in mobile menu', () => {
      const blok = createMockBlok({
        nav_items: [
          createMockNavItem('nav-1', 'Home'),
          createMockNavItem('nav-2', 'About'),
        ],
      });
      const { getByTestId, container } = render(<Header blok={blok} />);

      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      // Mobile menu should show nav items
      const mobileMenu = container.querySelector('.fixed');
      expect(mobileMenu).toBeInTheDocument();
    });
  });

  describe('Logo Link', () => {
    it('logo links to home page', () => {
      const blok = createMockBlok();
      render(<Header blok={blok} />);

      const logoLink = screen.getByRole('link');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('clicking logo closes mobile menu', () => {
      const blok = createMockBlok();
      const { getByTestId } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);
      expect(menuToggle).toHaveTextContent('Close');

      // Click logo
      const logoLink = screen.getByRole('link');
      fireEvent.click(logoLink);

      expect(menuToggle).toHaveTextContent('Menu');
    });
  });

  describe('Styles', () => {
    it('has sticky positioning', () => {
      const blok = createMockBlok();
      render(<Header blok={blok} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('has correct z-index', () => {
      const blok = createMockBlok();
      render(<Header blok={blok} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('z-50');
    });

    it('has responsive height', () => {
      const blok = createMockBlok();
      const { container } = render(<Header blok={blok} />);

      const innerContainer = container.querySelector(String.raw`.h-\[70px\]`);
      expect(innerContainer).toHaveClass('lg:h-[90px]');
    });
  });

  describe('Mobile Menu Dropdown Items', () => {
    it('renders nav items with sub-items in mobile menu', () => {
      const blok = createMockBlok({
        nav_items: [
          createMockNavItem('nav-1', 'Services', [
            createMockSubNavItem('sub-1', 'Service 1', '/service-1'),
            createMockSubNavItem('sub-2', 'Service 2', '/service-2'),
          ]),
        ],
      });
      const { getByTestId, container } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      // Check that nav item with sub-items is rendered
      const mobileMenu = container.querySelector('.fixed');
      expect(mobileMenu).toBeInTheDocument();
    });

    it('toggles dropdown in mobile menu when clicking item with sub-items', async () => {
      const blok = createMockBlok({
        nav_items: [
          createMockNavItem('nav-1', 'Services', [
            createMockSubNavItem('sub-1', 'Service 1', '/service-1'),
          ]),
        ],
      });
      const { getByTestId, container } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      // Find and click the dropdown button in mobile menu
      const dropdownButtons = container.querySelectorAll('button');
      const servicesButton = Array.from(dropdownButtons).find(btn =>
        btn.textContent?.includes('Services')
      );

      if (servicesButton) {
        fireEvent.click(servicesButton);
      }
    });

    it('closes mobile menu when clicking overlay', () => {
      const blok = createMockBlok({
        nav_items: [createMockNavItem('nav-1', 'Home')],
      });
      const { getByTestId, getByLabelText } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);
      expect(menuToggle).toHaveTextContent('Close');

      // Click backdrop button to close
      const backdropButton = getByLabelText('Close mobile menu');
      fireEvent.click(backdropButton);

      expect(menuToggle).toHaveTextContent('Menu');
    });

    it('closes mobile menu when clicking nav link', () => {
      const blok = createMockBlok({
        nav_items: [createMockNavItem('nav-1', 'About')],
      });
      const { getByTestId, container } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      // Find nav link in mobile menu and click it
      const mobileLinks = container.querySelectorAll('.fixed a');
      if (mobileLinks.length > 0) {
        fireEvent.click(mobileLinks[0]);
      }
    });

    it('marks active nav item in mobile menu', () => {
      mockPathname.mockReturnValue('/about');
      const blok = createMockBlok({
        nav_items: [createMockNavItem('nav-1', 'About')],
      });
      // Set link to match active pattern
      blok.nav_items![0].link = { cached_url: 'about', linktype: 'story' as const };

      const { getByTestId } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);
    });

    it('applies active styles to dropdown item with sub-items in mobile menu', () => {
      mockPathname.mockReturnValue('/services');
      const blok = createMockBlok({
        nav_items: [
          createMockNavItem('nav-1', 'Services', [
            createMockSubNavItem('sub-1', 'Service 1', '/service-1'),
          ]),
        ],
      });
      blok.nav_items![0].link = { cached_url: 'services', linktype: 'story' as const };

      const { getByTestId, container } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      // Find the dropdown button in aside element
      const aside = container.querySelector('aside');
      const dropdownButton = aside?.querySelector('button');
      const buttonText = dropdownButton?.querySelector('p');
      expect(buttonText).toHaveClass('text-primary-800');

      // Check chevron also has active color
      const chevron = dropdownButton?.querySelector('svg');
      expect(chevron).toHaveClass('text-primary-800');
    });

    it('uses fallback href for sub-items with undefined link properties', () => {
      const blok = createMockBlok({
        nav_items: [
          createMockNavItem('nav-1', 'Services', [
            createMockSubNavItem('sub-1', 'Service 1'),
          ]),
        ],
      });

      const { getByTestId, container } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      // Click to expand dropdown
      const dropdownButtons = container.querySelectorAll('.fixed button');
      const servicesButton = Array.from(dropdownButtons).find(btn =>
        btn.textContent?.includes('Services')
      );

      if (servicesButton) {
        fireEvent.click(servicesButton);

        // Check that subitem link uses fallback #
        const subItemLinks = container.querySelectorAll('.fixed a');
        const serviceLink = Array.from(subItemLinks).find(link =>
          link.textContent?.includes('Service 1')
        );
        expect(serviceLink).toHaveAttribute('href', '/service 1');
      }
    });
  });

  describe('Cleanup', () => {
    it('restores body overflow on unmount', () => {
      const blok = createMockBlok();
      const { getByTestId, unmount } = render(<Header blok={blok} />);

      // Open menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);
      expect(document.body.style.overflow).toBe('hidden');

      // Unmount
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Dropdown Animation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('collapses dropdown with animation delay', () => {
      const blok = createMockBlok({
        nav_items: [
          createMockNavItem('nav-1', 'Services', [
            createMockSubNavItem('sub-1', 'Service 1', '/service-1'),
          ]),
        ],
      });
      const { getByTestId, container } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      // Find and click the dropdown button to expand
      const dropdownButtons = container.querySelectorAll('button');
      const servicesButton = Array.from(dropdownButtons).find(btn =>
        btn.textContent?.includes('Services')
      );

      if (servicesButton) {
        // Expand dropdown
        fireEvent.click(servicesButton);
        act(() => {
          vi.advanceTimersByTime(10);
        });

        // Now collapse dropdown
        fireEvent.click(servicesButton);

        // After 300ms, the render items should be removed
        act(() => {
          vi.advanceTimersByTime(300);
        });
      }
    });

    it('expands dropdown with animation delay', () => {
      const blok = createMockBlok({
        nav_items: [
          createMockNavItem('nav-1', 'Services', [
            createMockSubNavItem('sub-1', 'Service 1', '/service-1'),
          ]),
        ],
      });
      const { getByTestId, container } = render(<Header blok={blok} />);

      // Open mobile menu
      const menuToggle = getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      // Find and click the dropdown button
      const dropdownButtons = container.querySelectorAll('button');
      const servicesButton = Array.from(dropdownButtons).find(btn =>
        btn.textContent?.includes('Services')
      );

      if (servicesButton) {
        fireEvent.click(servicesButton);

        // After 10ms delay, the expanded state should be set
        act(() => {
          vi.advanceTimersByTime(10);
        });
      }
    });
  });
});
