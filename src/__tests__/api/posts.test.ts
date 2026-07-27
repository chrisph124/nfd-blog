import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/posts/route';
import { NextRequest } from 'next/server';

// Mock Storyblok API
const mockGet = vi.fn();
vi.mock('@/lib/storyblok', () => ({
  getStoryblokApi: () => ({ get: mockGet }),
  storyblokVersion: 'published',
}));

const createMockRequest = (page?: string, perPage?: string) => {
  const url = new URL('http://localhost:3000/api/posts');
  if (page) url.searchParams.set('page', page);
  if (perPage) url.searchParams.set('per_page', perPage);

  return new NextRequest(url);
};

describe('POST API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid requests', () => {
    it('returns posts with default parameters', async () => {
      const mockPosts = [
        { id: 1, name: 'Post 1' },
        { id: 2, name: 'Post 2' },
      ];

      mockGet.mockResolvedValue({
        data: { stories: mockPosts },
        headers: { total: '48' },
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stories).toEqual(mockPosts);
      expect(data.total).toBe(48);
      expect(data.page).toBe(1);
      expect(data.perPage).toBe(12);
    });

    it('respects page parameter', async () => {
      mockGet.mockResolvedValue({
        data: { stories: [] },
        headers: { total: '0' },
      });

      const request = createMockRequest('3', '12');
      await GET(request);

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', {
        version: 'published',
        content_type: 'post',
        sort_by: 'first_published_at:desc',
        per_page: 12,
        page: 3,
      });
    });

    it('respects per_page parameter', async () => {
      mockGet.mockResolvedValue({
        data: { stories: [] },
        headers: { total: '0' },
      });

      const request = createMockRequest('1', '24');
      await GET(request);

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        per_page: 24,
      }));
    });

    it('sorts by first_published_at:desc', async () => {
      mockGet.mockResolvedValue({
        data: { stories: [] },
        headers: { total: '0' },
      });

      const request = createMockRequest();
      await GET(request);

      expect(mockGet).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        sort_by: 'first_published_at:desc',
      }));
    });
  });

  describe('Parameter validation', () => {
    it.each([
      { name: 'rejects page < 1', page: '0', perPage: '12' },
      { name: 'rejects per_page < 1', page: '1', perPage: '0' },
      { name: 'rejects per_page > 100', page: '1', perPage: '101' },
      { name: 'rejects NaN for page parameter', page: 'abc', perPage: '12' },
      { name: 'rejects NaN for per_page parameter', page: '1', perPage: 'xyz' },
    ])('$name', async ({ page, perPage }) => {
      const request = createMockRequest(page, perPage);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid pagination parameters');
    });
  });

  describe('Missing headers', () => {
    it('treats total as 0 when headers.total is missing', async () => {
      mockGet.mockResolvedValue({
        data: { stories: [] },
        headers: {},
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('handles Storyblok API errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGet.mockRejectedValue(new Error('Storyblok API error'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch posts');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching posts from Storyblok:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
