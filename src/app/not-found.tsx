import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-full">
      <div className="max-w-[1280px] px-6 md:px-10 lg:px-15 xl:px-5 mx-auto py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
