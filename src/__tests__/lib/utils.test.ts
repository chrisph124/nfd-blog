import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  describe('Basic functionality', () => {
    it('returns empty string for no arguments', () => {
      expect(cn()).toBe('');
    });

    it('returns single class unchanged', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('combines multiple classes', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });
  });

  describe('Conditional classes (clsx)', () => {
    it('handles boolean conditions', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('handles null and undefined', () => {
      expect(cn('base', null, undefined, 'end')).toBe('base end');
    });

    it('handles object syntax', () => {
      expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
    });

    it('handles array syntax', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('handles nested arrays', () => {
      expect(cn(['class1', ['class2', 'class3']])).toBe('class1 class2 class3');
    });
  });

  describe('Tailwind merge', () => {
    it('merges conflicting padding classes', () => {
      expect(cn('px-4', 'px-6')).toBe('px-6');
    });

    it('merges conflicting margin classes', () => {
      expect(cn('mt-2', 'mt-4')).toBe('mt-4');
    });

    it('merges conflicting text color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('merges conflicting background classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('keeps non-conflicting classes', () => {
      expect(cn('text-red-500', 'bg-blue-500', 'p-4')).toBe('text-red-500 bg-blue-500 p-4');
    });

    it('merges responsive variants correctly', () => {
      expect(cn('md:text-red-500', 'md:text-blue-500')).toBe('md:text-blue-500');
    });

    it('keeps different responsive variants', () => {
      expect(cn('text-red-500', 'md:text-blue-500')).toBe('text-red-500 md:text-blue-500');
    });

    it('merges conflicting width classes', () => {
      expect(cn('w-4', 'w-8')).toBe('w-8');
    });

    it('merges conflicting flex classes', () => {
      expect(cn('flex-row', 'flex-col')).toBe('flex-col');
    });
  });

  describe('Combined clsx and tailwind-merge', () => {
    it('handles conditional with merge', () => {
      const isActive = true;
      expect(cn('px-4', isActive && 'px-6')).toBe('px-6');
    });

    it('handles object syntax with merge', () => {
      expect(cn('text-red-500', { 'text-blue-500': true })).toBe('text-blue-500');
    });

    it('handles complex combination', () => {
      const result = cn(
        'base-class',
        'px-4',
        true && 'conditional',
        false && 'skipped',
        { 'object-class': true },
        'px-6' // Should override px-4
      );
      expect(result).toBe('base-class conditional object-class px-6');
    });
  });

  describe('Edge cases', () => {
    it('handles empty strings', () => {
      expect(cn('', 'class1', '')).toBe('class1');
    });

    it('handles whitespace', () => {
      expect(cn('  ', 'class1')).toBe('class1');
    });

    it('handles duplicate classes', () => {
      // tailwind-merge only deduplicates conflicting Tailwind classes, not arbitrary duplicates
      expect(cn('class1', 'class1')).toBe('class1 class1');
    });

    it('preserves important modifier', () => {
      expect(cn('!text-red-500')).toBe('!text-red-500');
    });

    it('handles arbitrary values', () => {
      expect(cn('w-[100px]', 'h-[200px]')).toBe('w-[100px] h-[200px]');
    });
  });
});
