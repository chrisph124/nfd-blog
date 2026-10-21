import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import PostListClient from '@/components/organisms/PostListClient';
import type { PostCardData } from '@/lib/post-card';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; [key: string]: unknown }) => {
    const { priority: _priority, fill: _fill, sizes: _sizes, ...imgProps } = rest as Record<string, unknown>;
    return React.createElement('img', { src, alt, ...imgProps });
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));

vi.mock('@/lib/storyblok', () => ({
  getStoryblokApi: vi.fn(),
}));

const createMockPost = (id: string): PostCardData => ({
  uuid: `uuid-${id}`,
  href: `/post-${id}`,
  title: `Post ${id} Title`,
  excerpt: `Excerpt for post ${id}`,
  image: { src: `https://a.storyblok.com/f/test-${id}.jpg`, alt: `Test image ${id}` },
  date: '2025-01-01T00:00:00.000Z',
  readingTime: '1 min read',
});

describe('PostListClient SSR invisibility regression', () => {
  const posts = ['1', '2', '3'].map(createMockPost);

  it('SSR HTML contains no opacity:0 inline style on any post card', () => {
    const html = renderToString(
      <PostListClient initialPosts={posts} perPage={12} hasMore={false} />
    );

    expect(html).not.toMatch(/opacity:\s*0/i);
    expect(html).not.toMatch(/opacity:0/i);
  });

  it('SSR HTML contains no translateY inline style on any post card', () => {
    const html = renderToString(
      <PostListClient initialPosts={posts} perPage={12} hasMore={false} />
    );

    expect(html).not.toMatch(/translateY/i);
  });

  it('SSR HTML renders all three post card articles', () => {
    const html = renderToString(
      <PostListClient initialPosts={posts} perPage={12} hasMore={false} />
    );

    const articleMatches = html.match(/<article/g);
    expect(articleMatches?.length).toBeGreaterThanOrEqual(3);
  });

  it('gives only the first (LCP) card the opacity-gate-free reveal variant', () => {
    const html = renderToString(
      <PostListClient initialPosts={posts} perPage={12} hasMore={false} />
    );

    // Exactly one card — the first/priority (LCP) card — uses the transform-only
    // variant, so the largest paint is never deferred behind an opacity fade.
    const lcpMatches = html.match(/post-card-reveal-lcp/g);
    expect(lcpMatches).toHaveLength(1);
  });
});
