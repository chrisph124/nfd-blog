'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface MenuToggleProps {
  onClick: () => void;
  isOpen: boolean;
}

const MenuToggle = memo(({ onClick, isOpen }: MenuToggleProps) => {
  // Base classes for all animated lines
  const LINE_BASE_CLASSES = "block h-[2px] w-full bg-gray-700 rounded-full transition-all duration-300 ease-in-out absolute";

  // Top line animation states
  const TOP_LINE_OPEN = "rotate-45 top-[6px]";
  const TOP_LINE_CLOSED = "rotate-0 top-0";

  // Middle line animation states
  const MIDDLE_LINE_BASE = "top-[6px]";
  const MIDDLE_LINE_OPEN = "opacity-0 scale-0";
  const MIDDLE_LINE_CLOSED = "opacity-100 scale-100";

  // Bottom line animation states
  const BOTTOM_LINE_OPEN = "-rotate-45 bottom-[6px]";
  const BOTTOM_LINE_CLOSED = "rotate-0 bottom-0";

  return (
    <button
      onClick={onClick}
      className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity lg:hidden flex items-center justify-center"
      aria-label="Toggle menu"
      type="button"
    >
      {/* Animated hamburger/X icon */}
      <div className="w-[20px] h-[14px] relative flex flex-col justify-between">
        <span
          className={cn(
            LINE_BASE_CLASSES,
            "top-0",
            isOpen ? TOP_LINE_OPEN : TOP_LINE_CLOSED
          )}
        />
        <span
          className={cn(
            LINE_BASE_CLASSES,
            MIDDLE_LINE_BASE,
            isOpen ? MIDDLE_LINE_OPEN : MIDDLE_LINE_CLOSED
          )}
        />
        <span
          className={cn(
            LINE_BASE_CLASSES,
            "bottom-0",
            isOpen ? BOTTOM_LINE_OPEN : BOTTOM_LINE_CLOSED
          )}
        />
      </div>
    </button>
  );
});

MenuToggle.displayName = 'MenuToggle';

export default MenuToggle;
