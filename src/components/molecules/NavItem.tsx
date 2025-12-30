import { memo } from 'react';
import Link from "next/link";
import { HiChevronDown } from "react-icons/hi2";
import type { StoryblokComponentProps, NavItemBlok } from "@/types/storyblok";
import { normalizeStoryblokUrl, cn } from "@/lib/utils";

const NavItem = memo(({ blok }: StoryblokComponentProps<NavItemBlok>) => {
  const label = blok.label ?? "Link";
  const href = normalizeStoryblokUrl(blok.link?.cached_url ?? blok.link?.url);
  const hasDropdown = blok.has_dropdown ?? false;
  const isActive = blok.isActive ?? false;

  // Navigation item classes
  const NAV_ITEM_BASE_CLASSES = "flex gap-[4px] items-center hover:text-primary-700 transition-colors";
  const NAV_ITEM_ACTIVE_CLASSES = "border-b border-primary-700 text-primary-800 font-bold";
  const NAV_ITEM_INACTIVE_CLASSES = "text-black font-normal";

  return (
    <Link
      href={href}
      className={cn(
        NAV_ITEM_BASE_CLASSES,
        isActive ? NAV_ITEM_ACTIVE_CLASSES : NAV_ITEM_INACTIVE_CLASSES
      )}
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
