import { memo } from 'react';
import { makeStoryblokEditable } from "@/lib/storyblok-utils";
import type { StoryblokComponentProps, FooterBlok } from "@/types/storyblok";
import { FaGithub, FaLinkedin, FaEnvelope, FaRss } from 'react-icons/fa';

const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/chrisph124', icon: FaGithub },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/chrispham124/', icon: FaLinkedin },
  { name: 'Email', url: 'mailto:chris.pham124@gmail.com', icon: FaEnvelope },
  { name: 'RSS feed', url: '/rss.xml', icon: FaRss },
] as const;

const FIRST_YEAR = 2025;

const Footer = memo(({ blok }: StoryblokComponentProps<FooterBlok>) => {
  const currentYear = new Date().getFullYear();
  const years = currentYear > FIRST_YEAR ? `${FIRST_YEAR}–${currentYear}` : `${FIRST_YEAR}`;

  return (
    <footer {...makeStoryblokEditable(blok)} className="w-full border-t border-gray-200 bg-background">
      <div className="py-6 max-w-7xl px-4 md:px-8 lg:px-12 xl:px-5 mx-auto">
        <div className="flex flex-col items-center text-center gap-5 md:flex-row md:justify-between">
          <p className="logo-font font-semibold text-transparent bg-linear-to-r from-primary-700 to-secondary-900 bg-clip-text">
            notesof.dev
          </p>

          {/* Hardcoded on purpose (ignores blok.copyright); ISR refreshes the year. */}
          <p className="text-sm text-gray-500 text-balance">© {years} Hieu (Chris) Pham. All rights reserved.</p>

          <div className="flex gap-6 justify-center lg:justify-end">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                // Padding with a matching negative margin gives a 44px tap area without changing the spacing.
                className="-m-2.5 p-2.5 text-foreground! hover:text-primary-700! transition-colors"
                aria-label={link.name}
              >
                <link.icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
