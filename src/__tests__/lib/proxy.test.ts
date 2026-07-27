import { describe, it, expect } from 'vitest';
import { proxy, config } from '@/proxy';

describe('proxy function', () => {
  describe('Blocking /global routes', () => {
    it.each([
      { name: 'blocks /global route and does not call next', pathname: '/global' },
      { name: 'blocks /global/header route and does not call next', pathname: '/global/header' },
      { name: 'blocks /global/footer route and does not call next', pathname: '/global/footer' },
      { name: 'blocks deeply nested /global routes', pathname: '/global/some/deep/path' },
    ])('$name', async ({ pathname }) => {
      const mockRequest = {
        nextUrl: { pathname },
        url: `http://localhost${pathname}`,
      } as unknown as Request;

      const result = await proxy(mockRequest as any);

      expect(result).toBeDefined();
      // Rewrite responses don't have x-middleware-next header
      expect(result.headers.get('x-middleware-next')).toBeNull();
    });
  });

  describe('Allowing normal routes', () => {
    it.each([
      { name: 'allows homepage route - has x-middleware-next header', pathname: '/' },
      { name: 'allows /blog route', pathname: '/blog' },
      { name: 'allows /blog/my-post route', pathname: '/blog/my-post' },
      { name: 'allows /about route', pathname: '/about' },
    ])('$name', async ({ pathname }) => {
      const mockRequest = {
        nextUrl: { pathname },
        url: `http://localhost${pathname}`,
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
