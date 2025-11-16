'use client';

import { memo } from 'react';

interface MenuToggleProps {
  onClick: () => void;
  isOpen: boolean;
}

const MenuToggle = memo(({ onClick, isOpen }: MenuToggleProps) => {
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
          className={`block h-[2px] w-full bg-gray-700 rounded-full transition-all duration-300 ease-in-out absolute top-0 ${
            isOpen ? 'rotate-45 top-[6px]' : 'rotate-0 top-0'
          }`}
        />
        <span
          className={`block h-[2px] w-full bg-gray-700 rounded-full transition-all duration-300 ease-in-out absolute top-[6px] ${
            isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
          }`}
        />
        <span
          className={`block h-[2px] w-full bg-gray-700 rounded-full transition-all duration-300 ease-in-out absolute bottom-0 ${
            isOpen ? '-rotate-45 bottom-[6px]' : 'rotate-0 bottom-0'
          }`}
        />
      </div>
    </button>
  );
});

MenuToggle.displayName = 'MenuToggle';

export default MenuToggle;
