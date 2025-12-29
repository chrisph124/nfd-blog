"use client";

import { useState, useRef, useEffect, memo } from "react";
import { makeStoryblokEditable, StoryblokServerComponent } from "@/lib/storyblok-utils";
import { HiChevronDown } from "react-icons/hi2";
import type { TabsBlok, TabItemBlok } from "@/types/storyblok";
import { cn } from "@/lib/utils";

interface TabsProps {
  blok: TabsBlok;
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = memo(({ label, isActive, onClick }: TabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-6 py-4 rounded-lg font-semibold   transition-colors cursor-pointer",
      isActive ? "cursor-default bg-blue-200 pointer-events-none" : "hover:bg-gray-100"
    )}
  >
    {label}
  </button>
));

TabButton.displayName = "TabButton";

interface DropdownProps {
  tabs: TabItemBlok[];
  activeTab: number;
  onSelect: (index: number) => void;
}

const TabDropdown = memo(({ tabs, activeTab, onSelect }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (index: number) => {
    onSelect(index);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl font-normal text-base text-gray-700 flex items-center justify-between"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* eslint-disable-next-line security/detect-object-injection */}
        <span>{tabs[activeTab]?.label || "Select tab"}</span>
        <HiChevronDown
          className={cn("size-4 transition-transform text-gray-700", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab._uid}
              type="button"
              role="option"
              aria-selected={activeTab === index}
              onClick={() => handleSelect(index)}
              className={cn(
                "w-full px-4 py-3 text-left font-normal text-base text-gray-700 hover:bg-gray-100 transition-colors",
                activeTab === index && "bg-blue-200"
              )}
            >
              {tab.label ?? `Tab ${index + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

TabDropdown.displayName = "TabDropdown";

const Tabs = memo(({ blok }: TabsProps) => {
  const { tabs } = blok;
  const [activeTab, setActiveTab] = useState(0);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  // eslint-disable-next-line security/detect-object-injection
  const activeTabContent = tabs[activeTab]?.content;

  return (
    <div {...makeStoryblokEditable(blok)} className="flex flex-col gap-12 items-center w-full">
      <div className="hidden md:flex gap-4 items-center justify-center">
        {tabs.map((tab, index) => (
          <TabButton
            key={tab._uid}
            label={tab.label ?? `Tab ${index + 1}`}
            isActive={activeTab === index}
            onClick={() => setActiveTab(index)}
          />
        ))}
      </div>

      <div className="md:hidden w-full px-4">
        <TabDropdown tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      </div>

      <div className="w-full">
        {activeTabContent?.map((nestedBlok) => (
          <StoryblokServerComponent key={nestedBlok._uid} blok={nestedBlok} />
        ))}
      </div>
    </div>
  );
});

Tabs.displayName = "Tabs";

export default Tabs;
