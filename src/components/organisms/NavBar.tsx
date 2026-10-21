'use client';

import { usePathname } from 'next/navigation';
import { memo } from 'react';
import Link from 'next/link';
import type { NavItemBlok } from '@/types/storyblok';
import { normalizeStoryblokUrl, cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';

interface NavBarProps {
  navItems: NavItemBlok[];
  inline?: boolean;
}

// Neutralises the shadcn trigger's button chrome so items look like text links.
const NAV_LINK_BASE =
  'flex gap-[4px] items-center text-[18px] leading-[24px] p-1 h-auto bg-transparent hover:bg-transparent focus:bg-transparent rounded-none transition-colors';
const NAV_LINK_ACTIVE = 'border-b border-primary-700 text-primary-800 font-bold';
const NAV_LINK_INACTIVE = 'text-foreground font-normal hover:text-primary-700';
// 44px tap targets below lg.
const NAV_LINK_INLINE = 'max-lg:min-h-11 max-lg:justify-center max-lg:px-2 max-lg:text-base';

const NavBar = memo(({ navItems, inline = false }: NavBarProps) => {
  const pathname = usePathname();

  const getIsActive = (itemUrl: string) =>
    (pathname === '/' && (itemUrl === '/' || itemUrl.includes('home'))) ||
    (pathname !== '/' && itemUrl !== '/' && pathname === itemUrl);

  return (
    // viewport={false} positions each dropdown directly under its own item.
    <NavigationMenu
      viewport={false}
      className={cn(
        'hidden flex-grow max-w-none items-center justify-end',
        inline ? 'min-[360px]:flex' : 'lg:flex'
      )}
    >
      <NavigationMenuList className={inline ? 'gap-1 lg:gap-[20px]' : 'gap-[20px]'}>
        {navItems.map((item) => {
          const itemUrl = normalizeStoryblokUrl(item.link?.cached_url ?? item.link?.url);
          const isActive = getIsActive(itemUrl);
          const hasSubItems = item.sub_items && item.sub_items.length > 0;

          return (
            <NavigationMenuItem key={item._uid}>
              {hasSubItems ? (
                <>
                  <NavigationMenuTrigger
                    className={cn(NAV_LINK_BASE, isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE)}
                  >
                    {item.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="min-w-[200px] rounded-[8px] border border-gray-200 bg-background py-[8px] shadow-lg">
                    {item.sub_items?.map((subItem) => (
                      <NavigationMenuLink key={subItem._uid} asChild>
                        <Link
                          href={normalizeStoryblokUrl(subItem.link?.cached_url ?? subItem.link?.url)}
                          className="block w-full rounded-none px-[16px] py-[8px] text-[16px] text-gray-700 no-underline! transition-all duration-200 hover:bg-gray-200"
                        >
                          {subItem.label}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink asChild>
                  <Link
                    href={itemUrl}
                    className={cn(
                      NAV_LINK_BASE,
                      inline && NAV_LINK_INLINE,
                      isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE,
                      'no-underline!'
                    )}
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
});

NavBar.displayName = 'NavBar';

export default NavBar;
