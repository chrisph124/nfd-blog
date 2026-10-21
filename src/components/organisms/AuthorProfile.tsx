import type { IconType } from 'react-icons';
import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';
import { AUTHOR_EMAIL, AUTHOR_GITHUB_URL, AUTHOR_LINKEDIN_URL, AUTHOR_NAME } from '@/lib/seo/author';

interface AuthorLink {
  label: string;
  href: string;
  icon: IconType;
}

const AUTHOR_LINKS: AuthorLink[] = [
  { label: 'GitHub', href: AUTHOR_GITHUB_URL, icon: FaGithub },
  { label: 'LinkedIn', href: AUTHOR_LINKEDIN_URL, icon: FaLinkedin },
  { label: AUTHOR_EMAIL, href: `mailto:${AUTHOR_EMAIL}`, icon: FaEnvelope },
];

// `!` beats the unlayered global `a:not(...)` link color and underline rule.
const LINK_CLASSES =
  'inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-gray-200 px-4 py-2 font-semibold no-underline! text-foreground! transition-colors hover:border-primary-700 hover:text-primary-700!';

const AuthorLinks = () => (
  <ul className="flex flex-wrap gap-3">
    {AUTHOR_LINKS.map(({ label, href, icon: Icon }) => {
      const isExternal = href.startsWith('http');
      return (
        <li key={href}>
          <a
            href={href}
            className={LINK_CLASSES}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'me noopener noreferrer' : undefined}
          >
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
            {/* The email may wrap on 320px screens instead of overflowing the pill. */}
            <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
          </a>
        </li>
      );
    })}
  </ul>
);

export default function AuthorProfile() {
  return (
    <section
      aria-label="About the author"
      className="w-full max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16 flex flex-col gap-10 text-lg text-gray-700"
    >
      <div className="flex flex-col gap-4">
        <h2>Who writes this</h2>
        <p>
          I&apos;m {AUTHOR_NAME}, a solution architect and software engineer. My home turf is the modern
          JavaScript ecosystem, though I rarely stay inside it, and over the years I&apos;ve built on many CMSs,
          from Sitecore to Storyblok.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2>What you&apos;ll find here</h2>
        <p>
          I write about what I learn at work and from trying new things, and about how the job keeps changing.
          Topics include solution architecture, AppSec and DevSecOps, AI, design and the life of a software
          engineer outside work. Many posts start with a problem I hit on a real project.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2>Elsewhere</h2>
        <p>Corrections and questions are welcome by email.</p>
        <AuthorLinks />
      </div>
    </section>
  );
}
