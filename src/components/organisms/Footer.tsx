import { memo } from 'react';
import { makeStoryblokEditable } from "@/lib/storyblok-utils";
import type { StoryblokComponentProps, FooterBlok } from "@/types/storyblok";

const Footer = memo(({ blok }: StoryblokComponentProps<FooterBlok>) => {
  return (
    <footer {...makeStoryblokEditable(blok)} className="bg-gray-800 text-white w-full">
      <div className="py-6 max-w-[1280px] px-6 md:px-10 lg:px-15 xl:px-5 mx-auto text-center">
        <p>{blok.copyright}</p>
        {/* Add footer links from blok.footer_links if needed */}
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
