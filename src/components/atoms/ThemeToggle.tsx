'use client';

import { useState, useEffect, memo } from 'react';
import { useTheme } from 'next-themes';
import { HiSun, HiMoon } from 'react-icons/hi2';

const ThemeToggle = memo(() => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  // Placeholder matching pill dimensions to prevent layout shift
  if (!mounted) {
    return <div className="h-7 w-14 rounded-full bg-gray-200" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
      className="relative flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full bg-gray-700 p-0.5 transition-colors duration-300"
    >
      {/* Sun icon (left) */}
      <HiSun className="absolute left-1.5 size-4 text-gray-300" />

      {/* Moon icon (right) */}
      <HiMoon className="absolute right-1.5 size-3.5 text-gray-300" />

      {/* Sliding knob */}
      <span
        className={`flex size-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <HiMoon className="size-3.5 text-gray-700" />
        ) : (
          <HiSun className="size-4 text-amber-500" />
        )}
      </span>
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
