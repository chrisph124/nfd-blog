import { describe, it, expect } from 'vitest';
import { proxy, config } from '@/proxy';

describe('proxy function', () => {
  describe('Blocking /global routes', () => {
    it('blocks /global route and does not call next', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/global' },
        url: 'http://localhost/global',
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      // Rewrite responses don't have x-middleware-next header
      expect(result.headers.get('x-middleware-next')).toBeNull();
    });

    it('blocks /global/header route and does not call next', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/global/header' },
        url: 'http://localhost/global/header',
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      expect(result.headers.get('x-middleware-next')).toBeNull();
    });

    it('blocks /global/footer route and does not call next', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/global/footer' },
        url: 'http://localhost/global/footer',
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      expect(result.headers.get('x-middleware-next')).toBeNull();
    });

    it('blocks deeply nested /global routes', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/global/some/deep/path' },
        url: 'http://localhost/global/some/deep/path',
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      expect(result.headers.get('x-middleware-next')).toBeNull();
    });
  });

  describe('Allowing normal routes', () => {
    it('allows homepage route - has x-middleware-next header', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/' },
        url: 'http://localhost/',
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      expect(result.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows /blog route', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/blog' },
        url: 'http://localhost/blog',
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      expect(result.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows /blog/my-post route', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/blog/my-post' },
        url: 'http://localhost/blog/my-post',
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      expect(result.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows /about route', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/about' },
        url: 'http://localhost/about',
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      expect(result.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('Config matcher pattern', () => {
    it('config has correct matcher pattern', () => {
      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
      expect(config.matcher[0]).toBe('/((?!api|_next/static|_next/image|favicon.ico).*)');
    });

    it('config matcher excludes API routes', () => {
      expect(config.matcher[0]).toContain('(?!api|_next');
    });

    it('config matcher excludes _next/static', () => {
      expect(config.matcher[0]).toContain('_next/static');
    });

    it('config matcher excludes _next/image', () => {
      expect(config.matcher[0]).toContain('_next/image');
    });

    it('config matcher excludes favicon.ico', () => {
      expect(config.matcher[0]).toContain('favicon.ico');
    });
  });
});
