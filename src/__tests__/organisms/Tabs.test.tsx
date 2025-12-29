import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from '@/components/organisms/Tabs';
import type { TabsBlok, TabItemBlok, StoryblokBlok } from '@/types/storyblok';

vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'storyblok-editable' })),
  StoryblokServerComponent: ({ blok }: { blok: StoryblokBlok }) => (
    <div data-testid={`content-${blok._uid}`}>{blok.component}</div>
  ),
}));

vi.mock('react-icons/hi2', () => ({
  HiChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-down-icon" className={className} />
  ),
}));

const createMockTab = (uid: string, label: string, content: StoryblokBlok[] = []): TabItemBlok => ({
  _uid: uid,
  component: 'tab_item',
  label,
  content,
});

const createMockBlok = (overrides: Partial<TabsBlok> = {}): TabsBlok => ({
  _uid: 'test-uid',
  component: 'tabs',
  tabs: [
    createMockTab('tab-1', 'Tab 1', [{ _uid: 'content-1', component: 'feature' }]),
    createMockTab('tab-2', 'Tab 2', [{ _uid: 'content-2', component: 'teaser' }]),
  ],
  ...overrides,
});

describe('Tabs', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const blok = createMockBlok();
      render(<Tabs blok={blok} />);

      // Tabs appear in both desktop and mobile views
      expect(screen.getAllByText('Tab 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Tab 2').length).toBeGreaterThan(0);
    });

    it('returns null when no tabs', () => {
      const blok = createMockBlok({ tabs: [] });
      const { container } = render(<Tabs blok={blok} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null when tabs is undefined', () => {
      const blok = createMockBlok({ tabs: undefined });
      const { container } = render(<Tabs blok={blok} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders first tab content by default', () => {
      const blok = createMockBlok();
      const { getByTestId } = render(<Tabs blok={blok} />);

      expect(getByTestId('content-content-1')).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('switches tab content when clicking tab button', () => {
      const blok = createMockBlok();
      const { getByTestId, queryByTestId } = render(<Tabs blok={blok} />);

      // First tab content is visible
      expect(getByTestId('content-content-1')).toBeInTheDocument();

      // Click second tab
      const tabButtons = screen.getAllByRole('button');
      const secondTab = tabButtons.find(btn => btn.textContent === 'Tab 2');
      fireEvent.click(secondTab!);

      // Second tab content is visible, first is not
      expect(getByTestId('content-content-2')).toBeInTheDocument();
      expect(queryByTestId('content-content-1')).not.toBeInTheDocument();
    });

    it('applies active styles to selected tab', () => {
      const blok = createMockBlok();
      render(<Tabs blok={blok} />);

      const tabButtons = screen.getAllByRole('button');
      const firstTab = tabButtons.find(btn => btn.textContent === 'Tab 1');

      expect(firstTab).toHaveClass('bg-blue-200');
    });

    it('updates active styles when switching tabs', () => {
      const blok = createMockBlok();
      render(<Tabs blok={blok} />);

      const tabButtons = screen.getAllByRole('button');
      const firstTab = tabButtons.find(btn => btn.textContent === 'Tab 1');
      const secondTab = tabButtons.find(btn => btn.textContent === 'Tab 2');

      fireEvent.click(secondTab!);

      expect(secondTab).toHaveClass('bg-blue-200');
      expect(firstTab).not.toHaveClass('bg-blue-200');
    });
  });

  describe('Default Labels', () => {
    it('uses default label when tab label is undefined', () => {
      const blok = createMockBlok({
        tabs: [
          { _uid: 'tab-1', component: 'tab_item', label: undefined, content: [] },
          { _uid: 'tab-2', component: 'tab_item', label: undefined, content: [] },
        ],
      });
      render(<Tabs blok={blok} />);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('uses default label in dropdown options when label is undefined', () => {
      const blok = createMockBlok({
        tabs: [
          { _uid: 'tab-1', component: 'tab_item', label: undefined, content: [] },
          { _uid: 'tab-2', component: 'tab_item', label: undefined, content: [] },
        ],
      });
      const { container } = render(<Tabs blok={blok} />);

      // Open dropdown
      const mobileDropdown = container.querySelector('.md\\:hidden button');
      if (mobileDropdown) {
        fireEvent.click(mobileDropdown);

        // Check dropdown options have default labels
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveTextContent('Tab 1');
        expect(options[1]).toHaveTextContent('Tab 2');
      }
    });
  });

  describe('Mobile Dropdown', () => {
    it('renders dropdown on mobile', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      const mobileDropdown = container.querySelector('.md\\:hidden');
      expect(mobileDropdown).toBeInTheDocument();
    });

    it('hides desktop tabs on mobile', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      const desktopTabs = container.querySelector('.hidden.md\\:flex');
      expect(desktopTabs).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('tab buttons have correct type', () => {
      const blok = createMockBlok();
      render(<Tabs blok={blok} />);

      const tabButtons = screen.getAllByRole('button');
      tabButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Styles', () => {
    it('has correct container layout', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-12', 'items-center', 'w-full');
    });
  });

  describe('Mobile Dropdown', () => {
    it('opens dropdown when clicking dropdown button', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      // Find mobile dropdown button
      const mobileDropdown = container.querySelector('.md\\:hidden button');
      expect(mobileDropdown).toBeInTheDocument();

      if (mobileDropdown) {
        fireEvent.click(mobileDropdown);

        // Listbox should appear
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();
      }
    });

    it('selects tab from dropdown', () => {
      const blok = createMockBlok();
      const { container, getByTestId, queryByTestId } = render(<Tabs blok={blok} />);

      // Open dropdown
      const mobileDropdown = container.querySelector('.md\\:hidden button');
      if (mobileDropdown) {
        fireEvent.click(mobileDropdown);

        // Select second tab
        const options = screen.getAllByRole('option');
        fireEvent.click(options[1]);

        // Should show second tab content
        expect(getByTestId('content-content-2')).toBeInTheDocument();
        expect(queryByTestId('content-content-1')).not.toBeInTheDocument();
      }
    });

    it('closes dropdown after selection', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      // Open dropdown
      const mobileDropdown = container.querySelector('.md\\:hidden button');
      if (mobileDropdown) {
        fireEvent.click(mobileDropdown);
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        // Select option
        const options = screen.getAllByRole('option');
        fireEvent.click(options[0]);

        // Listbox should be closed
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      }
    });

    it('closes dropdown when clicking outside', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      // Open dropdown
      const mobileDropdown = container.querySelector('.md\\:hidden button');
      if (mobileDropdown) {
        fireEvent.click(mobileDropdown);
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        // Click outside
        fireEvent.mouseDown(document.body);

        // Listbox should be closed
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      }
    });

    it('shows active tab label in dropdown button', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      const mobileDropdown = container.querySelector('.md\\:hidden button');
      expect(mobileDropdown).toHaveTextContent('Tab 1');
    });

    it('updates dropdown button label when tab changes', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      // Open dropdown and select second tab
      const mobileDropdown = container.querySelector('.md\\:hidden button');
      if (mobileDropdown) {
        fireEvent.click(mobileDropdown);
        const options = screen.getAllByRole('option');
        fireEvent.click(options[1]);

        // Check button shows new label
        expect(mobileDropdown).toHaveTextContent('Tab 2');
      }
    });

    it('rotates chevron when dropdown is open', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      const mobileDropdown = container.querySelector('.md\\:hidden button');
      if (mobileDropdown) {
        fireEvent.click(mobileDropdown);

        const chevron = container.querySelector('.md\\:hidden [data-testid="chevron-down-icon"]');
        expect(chevron).toHaveClass('rotate-180');
      }
    });

    it('has aria-expanded attribute', () => {
      const blok = createMockBlok();
      const { container } = render(<Tabs blok={blok} />);

      const mobileDropdown = container.querySelector('.md\\:hidden button');
      expect(mobileDropdown).toHaveAttribute('aria-expanded', 'false');

      if (mobileDropdown) {
        fireEvent.click(mobileDropdown);
        expect(mobileDropdown).toHaveAttribute('aria-expanded', 'true');
      }
    });
  });
});
