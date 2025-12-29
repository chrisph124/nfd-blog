'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { HiSun, HiMoon } from "react-icons/hi2";

const ThemeToggle = memo(() => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
  }, []);

  const toggleTheme = useCallback((): void => {
    setIsDark(prev => !prev);
    // You can add localStorage and document.documentElement.classList logic here later
    // For now, this uses CSS media query for dark mode
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className="relative shrink-0 size-[21px] hover:opacity-70 transition-opacity"
      aria-label="Toggle theme"
      type="button"
    >
      {isDark ? (
        <HiMoon className="size-full text-gray-700" />
      ) : (
        <HiSun className="size-full text-gray-700" />
      )}
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
