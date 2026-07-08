import { describe, it, expect } from 'vitest';
import { getYouTubeId, isYouTubeUrl } from '@/lib/youtube';

describe('youtube helpers', () => {
  describe('getYouTubeId', () => {
    it('extracts the 11-char id from watch, short, and embed URLs', () => {
      expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(getYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null when no 11-char id is present', () => {
      expect(getYouTubeId('https://example.com/watch?v=short')).toBeNull();
      expect(getYouTubeId('https://example.com/page')).toBeNull();
    });
  });

  describe('isYouTubeUrl', () => {
    it('is true for known YouTube hosts', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('https://m.youtube.com/')).toBe(true);
    });

    it('is false for non-YouTube hosts', () => {
      expect(isYouTubeUrl('https://vimeo.com/123')).toBe(false);
    });

    it('is false for a string that is not a valid URL', () => {
      // Exercises the catch branch: new URL(...) throws on malformed input.
      expect(isYouTubeUrl('not a url')).toBe(false);
    });
  });
});
