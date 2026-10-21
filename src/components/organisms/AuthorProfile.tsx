import { AUTHOR_NAME } from '@/lib/seo/author';

export default function AuthorProfile() {
  return (
    <section
      aria-label="About the author"
      className="w-full max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16 text-lg text-gray-700"
    >
      <p>
        I&apos;m {AUTHOR_NAME}, a solution architect and software engineer, which mostly means I create bugs at
        scale and then design systems to catch them. My home base is the modern JavaScript ecosystem, though I
        wander out of it often, and I&apos;ve wrestled a long list of CMSs, Sitecore and Storyblok among them. This
        blog covers architecture, AppSec and DevSecOps, AI, design, and the life around the keyboard.
      </p>
    </section>
  );
}
