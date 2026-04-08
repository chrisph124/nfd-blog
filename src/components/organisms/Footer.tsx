import { memo } from 'react';
import { makeStoryblokEditable } from "@/lib/storyblok-utils";
import type { StoryblokComponentProps, FooterBlok } from "@/types/storyblok";
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';

const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/chrisph124', icon: FaGithub },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/chrispham124/', icon: FaLinkedin },
  { name: 'Email', url: 'mailto:chris.pham124@gmail.com', icon: FaEnvelope },
] as const;

const Footer = memo(({ blok }: StoryblokComponentProps<FooterBlok>) => {
  return (
    <footer {...makeStoryblokEditable(blok)} className="bg-surface-inverted text-on-surface-inverted w-full shadow-sm dark:shadow-white/20">
      <div className="py-6 max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5 mx-auto">
        {/* Mobile/Tablet: Stacked column layout */}
        {/* Desktop: 3-column layout (domain, copyright, social) */}
        <div className="flex flex-col text-center gap-5 md:flex-row md:justify-between md:items-center">
          {/* Left: Domain name */}
          <h4 className='logo-font font-semibold'>notesof.dev</h4>

          {/* Center: Copyright (hardcoded, ignores blok.copyright) */}
          <p className="text-sm">© 2025 Hieu (Chris) Pham. All rights reserved.</p>

          {/* Right: Social links */}
          <div className="flex gap-6 justify-center lg:justify-end">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-on-surface-inverted hover:text-primary-400 transition-colors"
                aria-label={`${link.name} ${link.url}`}
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
