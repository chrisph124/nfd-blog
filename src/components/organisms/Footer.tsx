import { storyblokEditable } from "@storyblok/react/rsc";
import type { FooterProps } from "@/types/storyblok";

export default function Footer({ blok }: FooterProps) {
  return (
    <footer {...storyblokEditable(blok)} className="bg-gray-800 text-white w-full">
      <div className="py-6 max-w-[1240px] px-6 md:px-10 lg:px-15 2xl:px-20 mx-auto text-center">
        <p>{blok.copyright}</p>
        {/* Add footer links from blok.footer_links if needed */}
      </div>
    </footer>
  );
}
