'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import { HiChevronDown } from "react-icons/hi2";
import type { NavItemBlok } from '@/types/storyblok';
import { normalizeStoryblokUrl, cn } from '@/lib/utils';

interface NavBarProps {
  navItems: NavItemBlok[];
}

const NavBar = memo(({ navItems }: NavBarProps) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Desktop nav button classes
  const DESKTOP_NAV_BUTTON_BASE = "flex gap-[4px] items-center text-[18px] leading-[24px] p-1 cursor-pointer transition-colors";
  const DESKTOP_NAV_ACTIVE = "border-b border-primary-700 text-primary-800 font-bold";
  const DESKTOP_NAV_INACTIVE = "text-foreground font-normal hover:text-primary-700";

  // Dropdown chevron classes
  const DROPDOWN_CHEVRON_BASE = "size-[14px] transition-transform duration-300 ease-in-out";
  const DROPDOWN_CHEVRON_EXPANDED = "rotate-180";
  const DROPDOWN_CHEVRON_COLLAPSED = "rotate-0";

  // Get active state for navigation item
  const getIsActive = useCallback((itemUrl: string) => {
    return (pathname === '/' && (itemUrl === '/' || itemUrl.includes('home'))) ||
           (pathname !== '/' && itemUrl !== '/' && pathname === itemUrl);
  }, [pathname]);

  // Toggle dropdown expansion
  const toggleDropdown = useCallback((itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      // eslint-disable-next-line security/detect-object-injection
      [itemId]: !prev[itemId]
    }));
  }, []);

  // Clear all expanded items
  const clearExpandedItems = useCallback(() => {
    setExpandedItems({});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutside = Object.values(dropdownRefs.current).every(
        ref => ref && !ref.contains(target)
      );

      if (clickedOutside) {
        clearExpandedItems();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearExpandedItems]);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      clearExpandedItems();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [clearExpandedItems]);

  return (
    <nav className="hidden lg:flex flex-grow items-center justify-end">
      <div className="flex gap-[20px] items-center">
        {navItems.map((item) => {
          const itemUrl = normalizeStoryblokUrl(item.link?.cached_url ?? item.link?.url);
          const isActive = getIsActive(itemUrl);
          const hasSubItems = item.sub_items && item.sub_items.length > 0;
          const isExpanded = expandedItems[item._uid] ?? false;

          return (
            <div
              key={item._uid}
              className="relative"
              ref={(el) => {
                if (hasSubItems) {
                  dropdownRefs.current[item._uid] = el;
                }
              }}
            >
              {hasSubItems ? (
                <>
                  <button
                    onClick={() => toggleDropdown(item._uid)}
                    className={cn(
                      DESKTOP_NAV_BUTTON_BASE,
                      isActive ? DESKTOP_NAV_ACTIVE : DESKTOP_NAV_INACTIVE
                    )}
                  >
                    {item.label}
                    <HiChevronDown
                      className={cn(
                        DROPDOWN_CHEVRON_BASE,
                        isExpanded ? DROPDOWN_CHEVRON_EXPANDED : DROPDOWN_CHEVRON_COLLAPSED
                      )}
                    />
                  </button>

                  {/* Desktop Dropdown */}
                  {isExpanded && (
                    <div className="absolute top-full left-0 min-w-[200px] bg-background shadow-lg rounded-[8px] py-[8px] z-60 border border-gray-200">
                      {item.sub_items?.map((subItem) => (
                        <Link
                          key={subItem._uid}
                          href={normalizeStoryblokUrl(subItem.link?.cached_url ?? subItem.link?.url)}
                          onClick={clearExpandedItems}
                          className="block w-full px-[16px] py-[8px] text-[16px] text-gray-700 hover:bg-gray-200 transition-all duration-200 no-underline!"
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={itemUrl}
                  className={cn(
                    DESKTOP_NAV_BUTTON_BASE,
                    isActive ? DESKTOP_NAV_ACTIVE : DESKTOP_NAV_INACTIVE,
                    'no-underline!'
                  )}
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
});

NavBar.displayName = 'NavBar';

export default NavBar;
