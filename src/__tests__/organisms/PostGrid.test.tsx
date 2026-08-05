import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

vi.mock('@/components/molecules/Card', () => ({
  default: ({
    story,
    priority,
    className,
    style,
  }: {
    story: StoryblokStory<PostBlok>;
    priority?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <div
      data-testid="card"
      data-uuid={story.uuid}
      data-priority={String(priority)}
      className={className}
      style={style}
    />
  ),
}));

import PostGrid from '@/components/organisms/PostGrid';

const mkPost = (uuid: string): StoryblokStory<PostBlok> =>
  ({ uuid, content: { component: 'post' } } as unknown as StoryblokStory<PostBlok>);

describe('PostGrid', () => {
  it('renders one Card per post', () => {
    render(<PostGrid posts={[mkPost('a'), mkPost('b'), mkPost('c')]} />);
    expect(screen.getAllByTestId('card')).toHaveLength(3);
  });

  it('marks only the first card as priority (LCP)', () => {
    render(<PostGrid posts={[mkPost('a'), mkPost('b')]} />);
    const cards = screen.getAllByTestId('card');

    expect(cards[0]).toHaveAttribute('data-priority', 'true');
    expect(cards[1]).toHaveAttribute('data-priority', 'false');
  });

  it('applies the responsive grid classes matching the homepage grid', () => {
    const { container } = render(<PostGrid posts={[mkPost('a')]} />);
    const grid = container.firstElementChild;

    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3', 'gap-6');
  });

  it('reveals cards with an LCP-safe variant on the first (priority) card', () => {
    render(<PostGrid posts={[mkPost('a'), mkPost('b'), mkPost('c')]} />);
    const cards = screen.getAllByTestId('card');

    // First card is the LCP element: transform-only reveal, no opacity:0 gate.
    expect(cards[0]).toHaveClass('post-card-reveal-lcp');
    expect(cards[0]).not.toHaveClass('post-card-reveal');

    // Remaining cards keep the full fade-up reveal.
    cards.slice(1).forEach((card) => {
      expect(card).toHaveClass('post-card-reveal');
      expect(card).not.toHaveClass('post-card-reveal-lcp');
    });

    // Stagger index preserved on every card.
    cards.forEach((card, index) => {
      expect(card.style.getPropertyValue('--reveal-i')).toBe(String(index));
    });
  });

  it('renders an empty grid with no cards for an empty post set', () => {
    render(<PostGrid posts={[]} />);
    expect(screen.queryAllByTestId('card')).toHaveLength(0);
  });
});
