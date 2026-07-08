import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodeTabs from '@/components/molecules/CodeTabs';
import CodeTabsClient from '@/components/molecules/CodeTabsClient';
import type { CodeTabsBlok, CodeTabBlok } from '@/types/storyblok';

// Deterministic, fast highlighter — real Shiki output/XSS is covered by
// highlight-code.test.ts; here we assert component structure/behaviour.
vi.mock('@/lib/highlight-code', () => ({
  highlightCode: vi.fn(
    async (code: string, lang: string) =>
      `<pre class="shiki"><code>${lang}:${code}</code></pre>`
  ),
}));

// Editable attr marker (storyblokEditable only emits attrs in the Visual Editor).
vi.mock('@storyblok/react/rsc', () => ({
  storyblokEditable: vi.fn(() => ({ 'data-testid': 'sb-editable' })),
}));

const makeTab = (
  uid: string,
  label: string,
  code: string,
  language = 'bash',
  filename?: string
): CodeTabBlok => ({
  _uid: uid,
  component: 'code_tab',
  label,
  language,
  code,
  ...(filename !== undefined && { filename }),
});

const makeBlok = (tabs: CodeTabBlok[]): CodeTabsBlok => ({
  _uid: 'ct-1',
  component: 'code_tabs',
  tabs,
});

describe('CodeTabs (server component)', () => {
  it('renders nothing when there are no tabs', async () => {
    const ui = await CodeTabs({ blok: makeBlok([]) });
    expect(ui).toBeNull();
  });

  it('renders nothing when tabs is undefined', async () => {
    const ui = await CodeTabs({ blok: { _uid: 'ct-1', component: 'code_tabs' } as CodeTabsBlok });
    expect(ui).toBeNull();
  });

  it('renders one tab trigger per tab, with labels', async () => {
    const ui = await CodeTabs({
      blok: makeBlok([makeTab('t1', 'npm', 'npm i'), makeTab('t2', 'pnpm', 'pnpm add')]),
    });
    render(ui);

    expect(screen.getByRole('tab', { name: 'npm' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'pnpm' })).toBeInTheDocument();
  });

  it('highlights each tab server-side (pre.shiki markup present)', async () => {
    const ui = await CodeTabs({ blok: makeBlok([makeTab('t1', 'npm', 'npm i react', 'bash')]) });
    const { container } = render(ui);

    const pre = container.querySelector('pre.shiki');
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveTextContent('bash:npm i react');
  });

  it('defaults missing code/language before highlighting', async () => {
    const tab = { _uid: 't1', component: 'code_tab', label: 'npm' } as CodeTabBlok;
    const ui = await CodeTabs({ blok: makeBlok([tab]) });
    const { container } = render(ui);
    // language falls back to bash, code falls back to '' → mocked "bash:"
    expect(container.querySelector('pre.shiki')).toHaveTextContent('bash:');
  });

  it('wraps all tabs in a single unified code-tabs frame', async () => {
    const ui = await CodeTabs({
      blok: makeBlok([makeTab('t1', 'npm', 'npm i'), makeTab('t2', 'pnpm', 'pnpm add')]),
    });
    const { container } = render(ui);
    // One frame around the whole thing (not a separate frame per tab), with
    // both tabs' code present (forceMounted).
    expect(container.querySelectorAll('.code-tabs').length).toBe(1);
    expect(container.querySelectorAll('pre.shiki').length).toBe(2);
  });

  it('renders a filename header bar for a tab that has a filename', async () => {
    const ui = await CodeTabs({
      blok: makeBlok([makeTab('t1', 'npm', 'npm i', 'bash', 'package.json')]),
    });
    const { container } = render(ui);
    const title = container.querySelector('.code-frame__title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('package.json');
  });

  it('renders no filename header when a tab has no filename', async () => {
    const ui = await CodeTabs({ blok: makeBlok([makeTab('t1', 'npm', 'npm i')]) });
    const { container } = render(ui);
    expect(container.querySelector('.code-frame__title')).not.toBeInTheDocument();
  });

  it('spreads makeStoryblokEditable onto the wrapper', async () => {
    const ui = await CodeTabs({ blok: makeBlok([makeTab('t1', 'npm', 'npm i')]) });
    const { container } = render(ui);
    expect(container.querySelector('[data-testid="sb-editable"]')).toBeInTheDocument();
  });

  it('enhances every tab with a copy button (single enhancer over forceMounted content)', async () => {
    const ui = await CodeTabs({
      blok: makeBlok([makeTab('t1', 'npm', 'npm i'), makeTab('t2', 'pnpm', 'pnpm add')]),
    });
    const { container } = render(ui);

    // forceMount → both pre.shiki exist at mount; enhancer adds a copy button to each.
    await waitFor(() =>
      expect(container.querySelectorAll('[data-copy-btn]').length).toBe(2)
    );
  });

  it('switches the active tab on trigger click', async () => {
    const user = userEvent.setup();
    const ui = await CodeTabs({
      blok: makeBlok([makeTab('t1', 'npm', 'npm i'), makeTab('t2', 'pnpm', 'pnpm add')]),
    });
    render(ui);

    // First tab active by default.
    expect(screen.getByRole('tab', { name: 'npm' })).toHaveAttribute('data-state', 'active');

    await user.click(screen.getByRole('tab', { name: 'pnpm' }));
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'pnpm' })).toHaveAttribute('data-state', 'active')
    );
    expect(screen.getByRole('tab', { name: 'npm' })).toHaveAttribute('data-state', 'inactive');
  });
});

describe('CodeTabsClient (client shell)', () => {
  it('renders nothing for an empty tabs array', () => {
    const { container } = render(<CodeTabsClient tabs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
