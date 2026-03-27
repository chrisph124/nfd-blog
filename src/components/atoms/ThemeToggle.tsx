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

  // Placeholder matching button dimensions to prevent layout shift
  if (!mounted) {
    return <div className="xl:size-10 size-9 rounded-full bg-gray-200" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
      className={`flex xl:size-10 size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all duration-300 ${
        isDark
          ? 'border-orange-700/30 bg-gray-800 shadow-[0_0_12px_2px_rgba(234,88,12,0.25),inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_16px_4px_rgba(234,88,12,0.35)]'
          : 'border-neon-cyan-700/30 bg-gray-100 shadow-[0_0_12px_2px_rgba(0,204,202,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:shadow-[0_0_16px_4px_rgba(0,204,202,0.35)]'
      }`}
    >
      {isDark ? (
        <HiSun className="xl:size-5 size-4 text-orange-500" />
      ) : (
        <HiMoon className="xl:size-5 size-4 text-neon-cyan-700" />
      )}
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
