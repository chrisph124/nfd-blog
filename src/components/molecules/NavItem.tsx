import { memo } from 'react';
import Link from "next/link";
import { HiChevronDown } from "react-icons/hi2";
import type { StoryblokComponentProps, NavItemBlok } from "@/types/storyblok";

const NavItem = memo(({ blok }: StoryblokComponentProps<NavItemBlok>) => {
  const label = blok.label ?? "Link";
  const href = blok.link?.cached_url ?? blok.link?.url ?? "#";
  const hasDropdown = blok.has_dropdown ?? false;
  const isActive = blok.isActive ?? false;

  return (
    <Link
      href={href}
      className={`flex gap-[4px] items-center ${
        isActive
          ? "border-b border-primary-700 text-primary-800 font-bold"
          : "text-black font-normal"
      } hover:text-primary-700 transition-colors`}
    >
      <span className="text-[18px] leading-[24px] subtitle-1">
        {label}
      </span>
      {hasDropdown && (
        <HiChevronDown className="size-[14px]" />
      )}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

export default NavItem;
