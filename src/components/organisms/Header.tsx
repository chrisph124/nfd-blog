"use client";

import { makeStoryblokEditable } from "@/lib/storyblok-utils";
import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/atoms/ThemeToggle";
import MenuToggle from "@/components/atoms/MenuToggle";
import NavBar from "@/components/organisms/NavBar";
import type { StoryblokComponentProps, HeaderBlok } from "@/types/storyblok";
import { usePathname } from "next/navigation";

const Header = memo(({ blok }: Readonly<StoryblokComponentProps<HeaderBlok>>) => {
  const logo =
    blok.logo?.filename ??
    "/assets/f8202cc6898638b4bbed0f7c48b140d1c452bb95.svg";
  const logoAlt = blok.logo?.alt ?? "Logo";
  const title = blok.title ?? "The Folio";
  const navItems = blok.nav_items ?? [];
  const enableTheme = blok.enableTheme ?? false;

  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [renderItems, setRenderItems] = useState<Record<string, boolean>>({});

  // Get active state for navigation item
  const getIsActive = useCallback((itemUrl: string) => {
    return (
      (pathname === "/" && (itemUrl === "/" || itemUrl.includes("home"))) ||
      (pathname !== "/" && itemUrl !== "/" && pathname === `/${itemUrl}`)
    );
  }, [pathname]);

  // Toggle dropdown expansion
  const toggleDropdown = useCallback((itemId: string) => {
    // eslint-disable-next-line security/detect-object-injection
    const isCurrentlyExpanded = expandedItems[itemId];

    if (isCurrentlyExpanded) {
      // Collapse: first trigger animation, then remove from DOM after delay
      setExpandedItems((prev) => ({ ...prev, [itemId]: false }));
      setTimeout(() => {
        setRenderItems((prev) => ({ ...prev, [itemId]: false }));
      }, 300); // Match transition duration
    } else {
      // Expand: add to DOM first, then trigger animation
      setRenderItems((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setExpandedItems((prev) => ({ ...prev, [itemId]: true }));
      }, 10); // Small delay to trigger CSS transition
    }
  }, [expandedItems]);

  // Close mobile menu
  const closeMobileMenu = useCallback(() => {
    setIsMenuOpen(false);
    setExpandedItems({});
  }, []);

  // Toggle menu handler
  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header
        {...makeStoryblokEditable(blok)}
        className="w-full sticky top-0 bg-background z-50 shadow-sm"
      >
        <div className="flex h-[70px] lg:h-[90px] items-center w-full max-w-[1240px] px-6 md:px-10 lg:px-15 2xl:px-20 mx-auto">
          {/* Logo Section - Fixed width */}
          <Link href="/" className="flex gap-[14px] items-center flex-shrink-0">
            <div className="relative shrink-0 size-[48px]">
              <Image
                src={logo}
                alt={logoAlt}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col font-medium justify-center text-[24px] text-black">
              <p className="leading-[20px]">{title}</p>
            </div>
          </Link>

          {/* Navigation - Desktop only */}
          <NavBar navItems={navItems} />

          {/* Mobile/Tablet: Spacer */}
          <div className="flex-grow lg:hidden" />

          {/* Mobile Menu Toggle */}
          <MenuToggle
            onClick={handleMenuToggle}
            isOpen={isMenuOpen}
          />

          {/* Theme Toggle - Always visible */}
          <div className="flex gap-[20px] items-center flex-shrink-0">
            {enableTheme && <ThemeToggle />}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Now outside header so shadow shows properly */}
      <div
        className={`fixed top-[70px] bottom-0 left-0 right-0 lg:hidden z-40 transition-opacity duration-300 ease-in-out ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop button */}
        <button
          type="button"
          className="absolute inset-0 bg-gray-900/90 w-full h-full"
          onClick={closeMobileMenu}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closeMobileMenu();
            }
          }}
          tabIndex={isMenuOpen ? 0 : -1}
          aria-label="Close mobile menu"
        />

        {/* Menu panel */}
        <aside
          className={`relative flex flex-col gap-[32px] px-[16px] py-[32px] h-full w-[90%] md:w-[70%] bg-zinc-100 overflow-y-auto transition-transform duration-300 ease-in-out ml-auto ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          aria-label="Mobile navigation menu"
        >
          {/* Hero Typography */}
          <div className="flex flex-col gap-[10px] h-[200px] items-center justify-center rounded-[8px] bg-gradient-to-br from-primary-600 to-secondary-900">
            <p className="font-semibold text-[26px] leading-[40px] text-center text-gray-50 max-w-[202px]">
              Discover our world of digital art.
            </p>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-[12px]">
            {/* Navigation Items from Storyblok */}
            {navItems.map((item, index) => {
              const itemUrl = item.link?.cached_url ?? item.link?.url ?? "#";
              const isActive = getIsActive(itemUrl);
              const hasSubItems = item.sub_items && item.sub_items.length > 0;
              const isExpanded = expandedItems[item._uid] ?? false;

              return (
                <div key={item._uid}>
                  {hasSubItems ? (
                    // Item with dropdown - render as expandable section
                    <div className="flex flex-col gap-[28px] p-[16px]">
                      <button
                        onClick={() => toggleDropdown(item._uid)}
                        className="flex items-center justify-between w-full"
                      >
                        <p
                          className={`font-medium text-[24px] leading-[28px] ${
                            isActive ? "text-primary-800" : "text-gray-800"
                          }`}
                        >
                          {item.label}
                        </p>
                        <ChevronDownIcon
                          className={`size-[24px] transition-transform duration-300 ease-in-out ${
                            isExpanded ? "rotate-180" : "rotate-0"
                          } ${isActive ? "text-primary-800" : "text-gray-800"}`}
                        />
                      </button>

                      {/* Sub Items with smooth animation */}
                      {renderItems[item._uid] && (
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="flex flex-col bg-secondary-100 rounded-[10px] py-[12px]">
                            {item.sub_items?.map((subItem) => (
                              <Link
                                key={subItem._uid}
                                href={
                                  subItem.link?.cached_url ??
                                  subItem.link?.url ??
                                  "#"
                                }
                                onClick={closeMobileMenu}
                                className="flex items-center justify-between px-[16px] py-[12px] hover:bg-secondary-200 transition-colors"
                              >
                                <p className="font-medium text-[18px] leading-[28px] text-gray-700">
                                  {subItem.label}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular item without dropdown - render as link
                    <Link
                      href={itemUrl}
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between p-[16px] w-full"
                    >
                      <p
                        className={`font-medium text-[24px] leading-[28px] ${
                          isActive ? "text-primary-800" : "text-gray-800"
                        }`}
                      >
                        {item.label}
                      </p>
                    </Link>
                  )}

                  {/* Divider after each item */}
                  {index < navItems.length - 1 && (
                    <div className="bg-gray-300 h-[1px] w-full" />
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </>
  );
});

Header.displayName = 'Header';

export default Header;
