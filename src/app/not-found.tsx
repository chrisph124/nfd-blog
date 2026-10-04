import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="w-full">
      <div className="max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5 mx-auto py-15 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          // `!` beats the unlayered global `a:not(...)` link color/underline (same
          // pattern as TAG_PILL_CLASSES). The brand scale inverts in dark theme, so
          // dark:bg-primary-200 is the dark fill there.
          className="inline-block bg-primary-600 hover:bg-primary-700 dark:bg-primary-200 dark:hover:bg-primary-200/90 text-white! no-underline! font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
