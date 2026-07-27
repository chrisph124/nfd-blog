import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '@/components/organisms/Header';
import type { HeaderBlok, NavItemBlok, SubNavItemBlok, StoryblokLink } from '@/types/storyblok';

// Mock next/navigation
const mockPathname = vi.fn(() => '/');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// storyblokEditable emits attributes only in the Visual Editor; mock a stable
// marker so we can assert makeStoryblokEditable's output lands on the <header>.
vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-blok-uid': 'test-uid', className: 'storyblok__outline' })),
}));

// Keep NavBar (desktop) opaque — Header tests exercise the mobile Sheet.
vi.mock('@/components/organisms/NavBar', () => ({
  default: () => <nav data-testid="navbar" />,
}));

vi.mock('@/components/atoms/ThemeToggle', () => ({
  default: () => <button type="button" role="switch" aria-checked="false" aria-label="Switch to dark theme">Theme</button>,
}));

// Keep MenuToggle's tested API (onClick + isOpen); render a simple trigger.
vi.mock('@/components/atoms/MenuToggle', () => ({
  default: ({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) => (
    <button type="button" data-testid="menu-toggle" onClick={onClick}>
      {isOpen ? 'Close' : 'Menu'}
    </button>
  ),
}));

const createMockSubNavItem = (uid: string, label: string, url?: string): SubNavItemBlok => ({
  _uid: uid,
  component: 'sub_nav_item',
  label,
  link: { cached_url: url ?? `/${label.toLowerCase()}`, linktype: 'story' } as StoryblokLink,
});

const createMockNavItem = (uid: string, label: string, subItems?: SubNavItemBlok[]): NavItemBlok => ({
  _uid: uid,
  component: 'nav_item',
  label,
  link: { cached_url: `/${label.toLowerCase()}`, linktype: 'story' },
  sub_items: subItems,
});

const createMockBlok = (overrides: Partial<HeaderBlok> = {}): HeaderBlok => ({
  _uid: 'test-uid',
  component: 'header',
  title: 'Test Site',
  logo: { id: 1, filename: '/logo.svg', alt: 'Test Logo' },
  nav_items: [],
  enableTheme: false,
  ...overrides,
});

/** Open the mobile Sheet and wait for the dialog to mount. */
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('menu-toggle'));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
}

describe('Header', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/');
  });

  describe('Rendering', () => {
    it('renders a banner landmark', () => {
      render(<Header blok={createMockBlok()} />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders the site title as gradient logo text', () => {
      render(<Header blok={createMockBlok({ title: 'My Blog' })} />);
      const logo = screen.getByText('My Blog');
      expect(logo).toHaveClass('logo-font', 'text-transparent', 'bg-clip-text');
    });

    it('falls back to the default title when none provided', () => {
      render(<Header blok={createMockBlok({ title: undefined, logo: undefined })} />);
      expect(screen.getByText('The Folio')).toBeInTheDocument();
    });

    it('renders the NavBar (desktop nav)', () => {
      render(<Header blok={createMockBlok({ nav_items: [createMockNavItem('n1', 'Home')] })} />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('always renders the theme toggle', () => {
      render(<Header blok={createMockBlok()} />);
      expect(screen.getAllByRole('switch').length).toBeGreaterThanOrEqual(1);
    });

    it('defaults nav_items to [] when undefined', () => {
      render(<Header blok={createMockBlok({ nav_items: undefined })} />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });
  });

  describe('Storyblok Visual Editor', () => {
    it('spreads makeStoryblokEditable attributes onto the <header> wrapper', () => {
      render(<Header blok={createMockBlok()} />);
      // The editable attribute must live on the in-DOM banner, not on portalled
      // Sheet content, or the Visual Editor cannot bind click-to-edit.
      expect(screen.getByRole('banner')).toHaveAttribute('data-blok-uid', 'test-uid');
    });
  });

  describe('Mobile Sheet — open / close', () => {
    it('opens the Sheet (role="dialog") when the toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<Header blok={createMockBlok()} />);
      await openMenu(user);
      expect(screen.getByTestId('menu-toggle')).toHaveTextContent('Close');
    });

    it('closes the Sheet when the backdrop is clicked', async () => {
      const user = userEvent.setup();
      const { baseElement } = render(<Header blok={createMockBlok()} />);
      await openMenu(user);
      // The burger/logo are behind the modal overlay while open; closing happens
      // via backdrop, Escape, or a nav link — not by re-clicking the toggle.
      const overlay = baseElement.querySelector('[data-slot="sheet-overlay"]') as HTMLElement;
      expect(overlay).toBeInTheDocument();
      await user.click(overlay);
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('closes the Sheet on Escape', async () => {
      const user = userEvent.setup();
      render(<Header blok={createMockBlok()} />);
      await openMenu(user);
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('closes the Sheet when a nav link is clicked (SheetClose)', async () => {
      const user = userEvent.setup();
      render(<Header blok={createMockBlok({ nav_items: [createMockNavItem('n1', 'About')] })} />);
      await openMenu(user);
      await user.click(screen.getByRole('link', { name: 'About' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });

  describe('Mobile Sheet — body scroll lock (Radix marker)', () => {
    it('locks body scroll while open and releases it on close', async () => {
      const user = userEvent.setup();
      render(<Header blok={createMockBlok()} />);

      await openMenu(user);
      // Radix (react-remove-scroll) marks <body> with data-scroll-locked, NOT
      // an inline overflow style. Asserting this proves scroll-lock survived the
      // migration off the manual useEffect (guards a mobile scroll-stuck regression).
      expect(document.body).toHaveAttribute('data-scroll-locked');

      await user.keyboard('{Escape}');
      await waitFor(() => expect(document.body).not.toHaveAttribute('data-scroll-locked'));
    });

    it('releases the body scroll lock on unmount', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Header blok={createMockBlok()} />);

      await openMenu(user);
      expect(document.body).toHaveAttribute('data-scroll-locked');

      unmount();
      await waitFor(() => expect(document.body).not.toHaveAttribute('data-scroll-locked'));
    });
  });

  describe('Mobile menu content', () => {
    it('renders nav items inside the open Sheet', async () => {
      const user = userEvent.setup();
      render(
        <Header
          blok={createMockBlok({
            nav_items: [createMockNavItem('n1', 'Home'), createMockNavItem('n2', 'About')],
          })}
        />
      );
      await openMenu(user);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('renders an item with sub-items as an accordion that toggles open', async () => {
      const user = userEvent.setup();
      render(
        <Header
          blok={createMockBlok({
            nav_items: [
              createMockNavItem('n1', 'Services', [
                createMockSubNavItem('s1', 'Service 1', '/service-1'),
              ]),
            ],
          })}
        />
      );
      await openMenu(user);

      // Sub-item hidden until the accordion trigger is activated.
      expect(screen.queryByRole('link', { name: 'Service 1' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Services/ }));
      expect(await screen.findByRole('link', { name: 'Service 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Service 1' })).toHaveAttribute('href', '/service-1');
    });

    it('marks the active nav item in the mobile menu', async () => {
      mockPathname.mockReturnValue('/about');
      const user = userEvent.setup();
      const blok = createMockBlok({ nav_items: [createMockNavItem('n1', 'About')] });
      blok.nav_items![0].link = { cached_url: 'about', linktype: 'story' };

      render(<Header blok={blok} />);
      await openMenu(user);
      expect(screen.getByText('About')).toHaveClass('text-primary-800');
    });

    it('marks an active dropdown (sub-items) nav item as active', async () => {
      mockPathname.mockReturnValue('/services');
      const user = userEvent.setup();
      const blok = createMockBlok({
        nav_items: [createMockNavItem('n1', 'Services', [createMockSubNavItem('s1', 'Service 1')])],
      });
      blok.nav_items![0].link = { cached_url: 'services', linktype: 'story' };

      render(<Header blok={blok} />);
      await openMenu(user);
      expect(screen.getByText('Services')).toHaveClass('text-primary-800');
    });

    it('renders a divider between items but not after the last', async () => {
      const user = userEvent.setup();
      const { baseElement } = render(
        <Header
          blok={createMockBlok({
            nav_items: [createMockNavItem('n1', 'Home'), createMockNavItem('n2', 'About')],
          })}
        />
      );
      await openMenu(user);
      // Two items → exactly one divider.
      expect(baseElement.querySelectorAll(String.raw`.bg-gray-300.h-\[1px\]`)).toHaveLength(1);
    });
  });

  describe('Mobile menu URL fallbacks', () => {
    it('uses item.link.url when cached_url is absent', async () => {
      const user = userEvent.setup();
      render(
        <Header
          blok={createMockBlok({
            nav_items: [{
              _uid: 'n1', component: 'nav_item', label: 'External',
              link: { cached_url: undefined as unknown as string, url: 'https://example.com', linktype: 'url' },
            }],
          })}
        />
      );
      await openMenu(user);
      expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute('href', 'https://example.com');
    });

    it('uses the "#" fallback when a nav item has no link urls', async () => {
      const user = userEvent.setup();
      render(
        <Header
          blok={createMockBlok({
            nav_items: [{
              _uid: 'n1', component: 'nav_item', label: 'No Link',
              link: { cached_url: undefined as unknown as string, url: undefined as unknown as string, linktype: 'story' },
            }],
          })}
        />
      );
      await openMenu(user);
      expect(screen.getByRole('link', { name: 'No Link' })).toHaveAttribute('href', '#');
    });

    it('uses sub_item.link.url when cached_url is absent', async () => {
      const user = userEvent.setup();
      render(
        <Header
          blok={createMockBlok({
            nav_items: [createMockNavItem('n1', 'Services', [{
              _uid: 's1', component: 'sub_nav_item', label: 'Sub Service',
              link: { cached_url: undefined as unknown as string, url: '/sub-service', linktype: 'url' },
            }])],
          })}
        />
      );
      await openMenu(user);
      await user.click(screen.getByRole('button', { name: /Services/ }));
      expect(await screen.findByRole('link', { name: 'Sub Service' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sub Service' })).toHaveAttribute('href', '/sub-service');
    });

    it('uses the "#" fallback for a sub-item with no link urls', async () => {
      const user = userEvent.setup();
      render(
        <Header
          blok={createMockBlok({
            nav_items: [createMockNavItem('n1', 'Services', [{
              _uid: 's1', component: 'sub_nav_item', label: 'No URL Sub',
              link: { cached_url: undefined as unknown as string, url: undefined as unknown as string, linktype: 'story' },
            }])],
          })}
        />
      );
      await openMenu(user);
      await user.click(screen.getByRole('button', { name: /Services/ }));
      expect(await screen.findByRole('link', { name: 'No URL Sub' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'No URL Sub' })).toHaveAttribute('href', '#');
    });
  });

  describe('Logo link', () => {
    it('links to the home page', () => {
      render(<Header blok={createMockBlok()} />);
      expect(screen.getByRole('link', { name: 'Test Site' })).toHaveAttribute('href', '/');
    });
  });

  describe('Styles', () => {
    it('is sticky and elevated above content', () => {
      render(<Header blok={createMockBlok()} />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });
  });
});
