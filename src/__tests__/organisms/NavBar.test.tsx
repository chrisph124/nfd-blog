import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NavBar from '@/components/organisms/NavBar';
import type { NavItemBlok, SubNavItemBlok } from '@/types/storyblok';

// Mock next/navigation
const mockPathname = vi.fn(() => '/');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ChevronDownIcon: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-down-icon" className={className} />
  ),
}));

const createMockSubItem = (uid: string, label: string): SubNavItemBlok => ({
  _uid: uid,
  component: 'sub_nav_item',
  label,
  link: { cached_url: `/${label.toLowerCase()}`, linktype: 'story' },
});

const createMockNavItem = (
  uid: string,
  label: string,
  options: { hasDropdown?: boolean; subItems?: SubNavItemBlok[] } = {}
): NavItemBlok => ({
  _uid: uid,
  component: 'nav_item',
  label,
  link: { cached_url: `/${label.toLowerCase()}`, linktype: 'story' },
  has_dropdown: options.hasDropdown ?? false,
  sub_items: options.subItems ?? [],
});

describe('NavBar', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/');
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const navItems = [createMockNavItem('item-1', 'Home')];
      render(<NavBar navItems={navItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders all nav items', () => {
      const navItems = [
        createMockNavItem('item-1', 'Home'),
        createMockNavItem('item-2', 'About'),
        createMockNavItem('item-3', 'Contact'),
      ];
      render(<NavBar navItems={navItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('is hidden on mobile and visible on desktop', () => {
      const navItems = [createMockNavItem('item-1', 'Home')];
      const { container } = render(<NavBar navItems={navItems} />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('hidden', 'lg:flex');
    });

    it('renders empty nav when no items', () => {
      const { container } = render(<NavBar navItems={[]} />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders items as links when no subitems', () => {
      const navItems = [createMockNavItem('item-1', 'Home')];
      render(<NavBar navItems={navItems} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/home');
    });

    it('renders items as buttons when has subitems', () => {
      const navItems = [
        createMockNavItem('item-1', 'Services', {
          subItems: [createMockSubItem('sub-1', 'Service 1')],
        }),
      ];
      render(<NavBar navItems={navItems} />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Services');
    });
  });

  describe('Dropdown Functionality', () => {
    it('shows dropdown when clicking button with subitems', () => {
      const navItems = [
        createMockNavItem('item-1', 'Services', {
          subItems: [
            createMockSubItem('sub-1', 'Service 1'),
            createMockSubItem('sub-2', 'Service 2'),
          ],
        }),
      ];
      render(<NavBar navItems={navItems} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Service 1')).toBeInTheDocument();
      expect(screen.getByText('Service 2')).toBeInTheDocument();
    });

    it('hides dropdown when clicking button again', () => {
      const navItems = [
        createMockNavItem('item-1', 'Services', {
          subItems: [createMockSubItem('sub-1', 'Service 1')],
        }),
      ];
      render(<NavBar navItems={navItems} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.getByText('Service 1')).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByText('Service 1')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking subitem link', () => {
      const navItems = [
        createMockNavItem('item-1', 'Services', {
          subItems: [createMockSubItem('sub-1', 'Service 1')],
        }),
      ];
      render(<NavBar navItems={navItems} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const subItemLink = screen.getByText('Service 1');
      fireEvent.click(subItemLink);

      expect(screen.queryByText('Service 1')).not.toBeInTheDocument();
    });

    it('rotates chevron icon when dropdown is open', () => {
      const navItems = [
        createMockNavItem('item-1', 'Services', {
          subItems: [createMockSubItem('sub-1', 'Service 1')],
        }),
      ];
      render(<NavBar navItems={navItems} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const chevron = screen.getByTestId('chevron-down-icon');
      expect(chevron).toHaveClass('rotate-180');
    });
  });

  describe('Active State', () => {
    it('applies active styles to current page', () => {
      mockPathname.mockReturnValue('/about');
      const navItems = [createMockNavItem('item-1', 'About')];
      // The NavItem link has cached_url of '/about' but getIsActive checks for pathname === `/${itemUrl}`
      // So we need to set the link to just 'about' without leading slash
      navItems[0].link = { cached_url: 'about', linktype: 'story' };
      render(<NavBar navItems={navItems} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('border-b', 'border-primary-700', 'text-primary-800', 'font-bold');
    });

    it('applies inactive styles to other pages', () => {
      mockPathname.mockReturnValue('/about');
      const navItems = [createMockNavItem('item-1', 'Contact')];
      render(<NavBar navItems={navItems} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-black', 'font-normal');
    });

    it('marks home as active on root path', () => {
      mockPathname.mockReturnValue('/');
      const navItems = [
        createMockNavItem('item-1', 'Home', {}),
      ];
      // Override link to match home pattern
      navItems[0].link = { cached_url: 'home', linktype: 'story' };
      render(<NavBar navItems={navItems} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-primary-800', 'font-bold');
    });
  });

  describe('Styles', () => {
    it('has correct nav container styles', () => {
      const navItems = [createMockNavItem('item-1', 'Home')];
      const { container } = render(<NavBar navItems={navItems} />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('flex-grow', 'items-center', 'justify-center');
    });

    it('has gap between items', () => {
      const navItems = [createMockNavItem('item-1', 'Home')];
      const { container } = render(<NavBar navItems={navItems} />);

      const itemsContainer = container.querySelector(String.raw`.flex.gap-\[20px\]`);
      expect(itemsContainer).toBeInTheDocument();
    });
  });

  describe('URL Fallbacks', () => {
    it('uses url property when cached_url is undefined', () => {
      const navItems: NavItemBlok[] = [{
        _uid: 'item-1',
        component: 'nav_item',
        label: 'Test',
        link: { url: '/test-url', linktype: 'url' },
        has_dropdown: false,
        sub_items: [],
      }];
      render(<NavBar navItems={navItems} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/test-url');
    });

    it('uses # when both cached_url and url are undefined', () => {
      const navItems: NavItemBlok[] = [{
        _uid: 'item-1',
        component: 'nav_item',
        label: 'Test',
        link: { linktype: 'story' },
        has_dropdown: false,
        sub_items: [],
      }];
      render(<NavBar navItems={navItems} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });

    it('uses # for subitem when link properties are undefined', () => {
      const navItems: NavItemBlok[] = [{
        _uid: 'item-1',
        component: 'nav_item',
        label: 'Services',
        link: { cached_url: '/services', linktype: 'story' },
        has_dropdown: true,
        sub_items: [{
          _uid: 'sub-1',
          component: 'sub_nav_item',
          label: 'Sub Item',
          link: { linktype: 'story' },
        }],
      }];
      render(<NavBar navItems={navItems} />);

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const subItemLink = screen.getByText('Sub Item');
      expect(subItemLink).toHaveAttribute('href', '#');
    });

    it('applies active styles to dropdown button when active', () => {
      mockPathname.mockReturnValue('/services');
      const navItems: NavItemBlok[] = [{
        _uid: 'item-1',
        component: 'nav_item',
        label: 'Services',
        link: { cached_url: 'services', linktype: 'story' },
        has_dropdown: true,
        sub_items: [createMockSubItem('sub-1', 'Service 1')],
      }];
      render(<NavBar navItems={navItems} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-b', 'border-primary-700', 'text-primary-800', 'font-bold');
    });
  });

  describe('Event Handlers', () => {
    it('closes dropdown when clicking outside', () => {
      const navItems = [
        createMockNavItem('item-1', 'Services', {
          subItems: [createMockSubItem('sub-1', 'Service 1')],
        }),
      ];
      render(<NavBar navItems={navItems} />);

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.getByText('Service 1')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      // Dropdown should be closed
      expect(screen.queryByText('Service 1')).not.toBeInTheDocument();
    });

    it('closes dropdown on scroll', () => {
      const navItems = [
        createMockNavItem('item-1', 'Services', {
          subItems: [createMockSubItem('sub-1', 'Service 1')],
        }),
      ];
      render(<NavBar navItems={navItems} />);

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.getByText('Service 1')).toBeInTheDocument();

      // Scroll
      fireEvent.scroll(window);

      // Dropdown should be closed
      expect(screen.queryByText('Service 1')).not.toBeInTheDocument();
    });

    it('keeps dropdown open when clicking inside', () => {
      const navItems = [
        createMockNavItem('item-1', 'Services', {
          subItems: [createMockSubItem('sub-1', 'Service 1')],
        }),
      ];
      const { container } = render(<NavBar navItems={navItems} />);

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Click inside dropdown
      const dropdown = container.querySelector('.absolute');
      if (dropdown) {
        fireEvent.mouseDown(dropdown);
      }

      // Dropdown should still be open
      expect(screen.getByText('Service 1')).toBeInTheDocument();
    });
  });
});
