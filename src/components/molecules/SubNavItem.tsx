import { memo } from 'react';
import Link from "next/link";
import type { SubNavItemProps } from "@/types/storyblok";

const SubNavItem = memo(({ blok }: SubNavItemProps) => {
  const label = blok.label ?? "Link";
  const href = blok.link?.cached_url ?? blok.link?.url ?? "#";

  return (
    <Link
      href={href}
      className="flex items-center justify-between px-[16px] py-[12px] hover:bg-secondary-200 transition-colors"
    >
      <p className="font-medium text-[18px] leading-[28px] text-gray-700">
        {label}
      </p>
    </Link>
  );
});

SubNavItem.displayName = 'SubNavItem';

export default SubNavItem;
