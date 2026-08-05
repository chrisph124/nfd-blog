import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

vi.mock('@/components/molecules/Card', () => ({
  default: ({ story, priority }: { story: StoryblokStory<PostBlok>; priority?: boolean }) => (
    <div data-testid="card" data-uuid={story.uuid} data-priority={String(priority)} />
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

  it('renders an empty grid with no cards for an empty post set', () => {
    render(<PostGrid posts={[]} />);
    expect(screen.queryAllByTestId('card')).toHaveLength(0);
  });
});
