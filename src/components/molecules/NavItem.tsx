import { memo } from 'react';
import Link from "next/link";
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { NavItemProps } from "@/types/storyblok";

const NavItem = memo(({ blok }: NavItemProps) => {
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
          : "text-gray-700 font-normal"
      } hover:text-primary-700 transition-colors`}
    >
      <span className="text-[18px] leading-[24px] subtitle-1">
        {label}
      </span>
      {hasDropdown && (
        <ChevronDownIcon className="size-[14px]" />
      )}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

export default NavItem;
