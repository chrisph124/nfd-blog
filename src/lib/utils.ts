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
