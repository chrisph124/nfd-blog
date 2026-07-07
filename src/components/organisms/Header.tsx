"use client";

import { makeStoryblokEditable } from "@/lib/storyblok-utils";
import { useState, memo } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/atoms/ThemeToggle";
import MenuToggle from "@/components/atoms/MenuToggle";
import NavBar from "@/components/organisms/NavBar";
import type { StoryblokComponentProps, HeaderBlok } from "@/types/storyblok";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// Mobile nav item text classes
const MOBILE_NAV_ITEM_TEXT_BASE = "font-medium text-[24px] leading-[28px]";
const MOBILE_NAV_ITEM_ACTIVE_TEXT = "text-primary-800";
const MOBILE_NAV_ITEM_INACTIVE_TEXT = "text-gray-800";

const Header = memo(({ blok }: Readonly<StoryblokComponentProps<HeaderBlok>>) => {
  const title = blok.title ?? "The Folio";
  const navItems = blok.nav_items ?? [];

  const pathname = usePathname();
  // Radix Sheet (Dialog) owns focus-trap, scroll-lock, Escape and backdrop; we
  // only track open state so the burger animates and links can close the sheet.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getIsActive = (itemUrl: string) =>
    (pathname === "/" && (itemUrl === "/" || itemUrl.includes("home"))) ||
    (pathname !== "/" && itemUrl !== "/" && pathname === `/${itemUrl}`);

  return (
    <>
      <header
        {...makeStoryblokEditable(blok)}
        className="w-full sticky top-0 bg-background z-50 shadow-sm dark:shadow-white/20"
      >
        <div className="flex h-[70px] lg:h-[90px] items-center w-full max-w-[1280px] px-4 md:px-8 lg:px-12 xl:px-5 mx-auto">
          {/* Logo Section — while the Sheet is open it is covered by the modal
              overlay; navigating home unmounts the Header and closes the menu. */}
          <Link href="/">
            <span className="h4 logo-font text-transparent bg-linear-to-r from-primary-700 to-secondary-900 bg-clip-text">
              {title}
            </span>
          </Link>

          {/* Navigation - Desktop only */}
          <NavBar navItems={navItems} />

          {/* Mobile/Tablet: Spacer */}
          <div className="flex-grow lg:hidden" />

          {/* Theme Toggle - Mobile, next to burger */}
          <div className="lg:hidden flex items-center mr-4">
            <ThemeToggle />
          </div>

          {/* Mobile Menu Toggle */}
          <MenuToggle
            onClick={() => setIsMenuOpen((open) => !open)}
            isOpen={isMenuOpen}
          />

          {/* Theme Toggle - Desktop only */}
          <div className="hidden lg:flex ml-6 items-center shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Menu — Radix Sheet (Dialog) */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="lg:hidden w-[90%] md:w-[70%] sm:max-w-none gap-0 p-0 bg-gray-100"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>

          <div className="flex flex-col gap-[12px] px-[16px] py-[32px] h-full overflow-y-auto">
            {navItems.map((item, index) => {
              const itemUrl = item.link?.cached_url ?? item.link?.url ?? "#";
              const isActive = getIsActive(itemUrl);
              const hasSubItems = item.sub_items && item.sub_items.length > 0;

              return (
                <div key={item._uid}>
                  {hasSubItems ? (
                    // Item with sub-items → Accordion (single, collapsible)
                    <Accordion type="single" collapsible>
                      <AccordionItem value={item._uid} className="border-b-0">
                        <AccordionTrigger
                          className={cn(
                            "p-[16px] hover:no-underline",
                            isActive && "[&>svg]:text-primary-800"
                          )}
                        >
                          <span
                            className={cn(
                              MOBILE_NAV_ITEM_TEXT_BASE,
                              isActive
                                ? MOBILE_NAV_ITEM_ACTIVE_TEXT
                                : MOBILE_NAV_ITEM_INACTIVE_TEXT
                            )}
                          >
                            {item.label}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-[16px]">
                          <div className="flex flex-col bg-secondary-100 rounded-[10px] py-[12px]">
                            {item.sub_items?.map((subItem) => (
                              <SheetClose asChild key={subItem._uid}>
                                <Link
                                  href={
                                    subItem.link?.cached_url ??
                                    subItem.link?.url ??
                                    "#"
                                  }
                                  className="flex items-center justify-between px-[16px] py-[12px] hover:bg-secondary-200 transition-colors"
                                >
                                  <p className="font-medium text-[18px] leading-[28px] text-foreground">
                                    {subItem.label}
                                  </p>
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    // Regular item → link that closes the sheet on navigation
                    <SheetClose asChild>
                      <Link
                        href={itemUrl}
                        className="flex items-center justify-between p-[16px] w-full"
                      >
                        <p
                          className={cn(
                            MOBILE_NAV_ITEM_TEXT_BASE,
                            isActive
                              ? MOBILE_NAV_ITEM_ACTIVE_TEXT
                              : MOBILE_NAV_ITEM_INACTIVE_TEXT
                          )}
                        >
                          {item.label}
                        </p>
                      </Link>
                    </SheetClose>
                  )}

                  {/* Divider after each item */}
                  {index < navItems.length - 1 && (
                    <div className="bg-gray-300 h-[1px] w-full" />
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});

Header.displayName = "Header";

export default Header;
