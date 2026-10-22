import { AUTHOR_NAME } from '@/lib/seo/author';

export default function AuthorProfile() {
  return (
    <section
      aria-label="About the author"
      className="w-full max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16 text-lg text-gray-700"
    >
      <p>
        {AUTHOR_NAME} here, a software engineer who writes bugs for a living and fixes a few of them on good
        days. Home base is the modern JavaScript ecosystem, with plenty of trips outside it and a long list of
        CMSs wrestled along the way, Sitecore and Storyblok among them. The blog covers architecture, AppSec and
        DevSecOps, AI, design, and the life around the keyboard.
      </p>
    </section>
  );
}
