import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavBar from '@/components/organisms/NavBar';
import type { NavItemBlok, SubNavItemBlok } from '@/types/storyblok';

// Mock next/navigation
const mockPathname = vi.fn(() => '/');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
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
  options: { subItems?: SubNavItemBlok[] } = {}
): NavItemBlok => ({
  _uid: uid,
  component: 'nav_item',
  label,
  link: { cached_url: `/${label.toLowerCase()}`, linktype: 'story' },
  has_dropdown: (options.subItems?.length ?? 0) > 0,
  sub_items: options.subItems ?? [],
});

describe('NavBar', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/');
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<NavBar navItems={[createMockNavItem('item-1', 'Home')]} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders all top-level nav items', () => {
      render(
        <NavBar
          navItems={[
            createMockNavItem('item-1', 'Home'),
            createMockNavItem('item-2', 'About'),
            createMockNavItem('item-3', 'Contact'),
          ]}
        />
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('is hidden on mobile and visible on desktop', () => {
      const { container } = render(<NavBar navItems={[createMockNavItem('item-1', 'Home')]} />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('hidden', 'lg:flex');
    });

    it('renders an (empty) nav when no items', () => {
      const { container } = render(<NavBar navItems={[]} />);
      expect(container.querySelector('nav')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders items without sub-items as links', () => {
      render(<NavBar navItems={[createMockNavItem('item-1', 'Home')]} />);
      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).toHaveAttribute('href', '/home');
    });

    it('renders items with sub-items as a dropdown trigger (button)', () => {
      render(
        <NavBar
          navItems={[
            createMockNavItem('item-1', 'Services', { subItems: [createMockSubItem('sub-1', 'Service 1')] }),
          ]}
        />
      );
      expect(screen.getByRole('button', { name: /Services/ })).toBeInTheDocument();
    });
  });

  describe('Dropdown disclosure (hover / focus, per Radix NavigationMenu)', () => {
    it('reveals sub-items when the trigger is hovered', async () => {
      const user = userEvent.setup();
      render(
        <NavBar
          navItems={[
            createMockNavItem('item-1', 'Services', {
              subItems: [createMockSubItem('sub-1', 'Service 1'), createMockSubItem('sub-2', 'Service 2')],
            }),
          ]}
        />
      );

      const trigger = screen.getByRole('button', { name: /Services/ });
      await user.hover(trigger);

      await waitFor(() => expect(screen.getByText('Service 1')).toBeInTheDocument());
      expect(screen.getByText('Service 2')).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-state', 'open');
    });

    it('reveals sub-items when the trigger receives keyboard focus/activation', async () => {
      const user = userEvent.setup();
      render(
        <NavBar
          navItems={[
            createMockNavItem('item-1', 'Services', { subItems: [createMockSubItem('sub-1', 'Service 1')] }),
          ]}
        />
      );

      const trigger = screen.getByRole('button', { name: /Services/ });
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => expect(screen.getByText('Service 1')).toBeInTheDocument());
    });

    it('sub-item links carry the resolved href', async () => {
      const user = userEvent.setup();
      render(
        <NavBar
          navItems={[
            createMockNavItem('item-1', 'Services', { subItems: [createMockSubItem('sub-1', 'Service 1')] }),
          ]}
        />
      );

      await user.hover(screen.getByRole('button', { name: /Services/ }));
      await waitFor(() => expect(screen.getByRole('link', { name: 'Service 1' })).toBeInTheDocument());
      expect(screen.getByRole('link', { name: 'Service 1' })).toHaveAttribute('href', '/service 1');
    });
  });

  describe('Active State', () => {
    it('applies active styles to the current page link', () => {
      mockPathname.mockReturnValue('/about');
      const navItems = [createMockNavItem('item-1', 'About')];
      navItems[0].link = { cached_url: 'about', linktype: 'story' };
      render(<NavBar navItems={navItems} />);

      const link = screen.getByRole('link', { name: 'About' });
      expect(link).toHaveClass('border-b', 'border-primary-700', 'text-primary-800', 'font-bold');
    });

    it('applies inactive styles to other pages', () => {
      mockPathname.mockReturnValue('/about');
      render(<NavBar navItems={[createMockNavItem('item-1', 'Contact')]} />);

      const link = screen.getByRole('link', { name: 'Contact' });
      expect(link).toHaveClass('text-foreground', 'font-normal');
    });

    it('marks home as active on the root path', () => {
      mockPathname.mockReturnValue('/');
      const navItems = [createMockNavItem('item-1', 'Home')];
      navItems[0].link = { cached_url: 'home', linktype: 'story' };
      render(<NavBar navItems={navItems} />);

      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).toHaveClass('text-primary-800', 'font-bold');
    });

    it('applies active styles to a dropdown trigger when active', () => {
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

      const trigger = screen.getByRole('button', { name: /Services/ });
      expect(trigger).toHaveClass('border-b', 'border-primary-700', 'text-primary-800', 'font-bold');
    });
  });

  describe('URL Fallbacks', () => {
    it('uses the url property when cached_url is undefined', () => {
      const navItems: NavItemBlok[] = [{
        _uid: 'item-1',
        component: 'nav_item',
        label: 'Test',
        link: { url: '/test-url', linktype: 'url' },
        has_dropdown: false,
        sub_items: [],
      }];
      render(<NavBar navItems={navItems} />);
      expect(screen.getByRole('link', { name: 'Test' })).toHaveAttribute('href', '/test-url');
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
      expect(screen.getByRole('link', { name: 'Test' })).toHaveAttribute('href', '#');
    });

    it('uses # for a sub-item whose link properties are undefined', async () => {
      const user = userEvent.setup();
      const navItems: NavItemBlok[] = [{
        _uid: 'item-1',
        component: 'nav_item',
        label: 'Services',
        link: { cached_url: '/services', linktype: 'story' },
        has_dropdown: true,
        sub_items: [{ _uid: 'sub-1', component: 'sub_nav_item', label: 'Sub Item', link: { linktype: 'story' } }],
      }];
      render(<NavBar navItems={navItems} />);

      await user.hover(screen.getByRole('button', { name: /Services/ }));
      await waitFor(() => expect(screen.getByRole('link', { name: 'Sub Item' })).toBeInTheDocument());
      expect(screen.getByRole('link', { name: 'Sub Item' })).toHaveAttribute('href', '#');
    });
  });
});
