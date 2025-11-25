import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for optimal class name handling
 * - clsx: Handles conditional classes
 * - twMerge: Resolves Tailwind CSS class conflicts
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-blue-500', 'px-6') // 'px-6 py-2 bg-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate estimated reading time for text content
 * Average reading speed: 200-250 words per minute
 *
 * @param text - The text content to analyze
 * @param wordsPerMinute - Reading speed (default: 200)
 * @returns Formatted reading time string (e.g., "5 min read")
 */
export function getReadingTime(text: string, wordsPerMinute: number = 200): string {
  if (!text) return '1 min read';

  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  return `${minutes} min read`;
}

/**
 * Format date to readable string
 *
 * @param dateString - ISO date string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string (e.g., "Nov 23, 2025")
 */
export function formatDate(dateString: string, locale: string = 'en-US'): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
