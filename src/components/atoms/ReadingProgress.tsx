'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

interface ReadingProgressBarProps {
  height?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
  position?: 'fixed' | 'sticky';
  showPercentage?: boolean;
  zIndex?: number;
}

const ReadingProgressBar = memo<ReadingProgressBarProps>(({
  height = 4,
  className,
  color = 'bg-gradient-to-r from-indigo-400 to-cyan-400',
  backgroundColor = 'bg-gray-200 dark:bg-gray-700',
  position = 'fixed',
  showPercentage = false,
  zIndex = 50,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Calculate reading progress based on scroll position
  const calculateProgress = useCallback((): number => {
    if (typeof window === 'undefined') return 0;

    const { scrollY, innerHeight } = window;
    const { scrollHeight } = document.documentElement;

    // Handle edge case: content shorter than viewport
    if (scrollHeight <= innerHeight) return 100;

    // Calculate progress percentage based on scrollable content only
    const scrollableHeight = scrollHeight - innerHeight;
    const progressPercentage = (scrollY / scrollableHeight) * 100;

    return Math.min(progressPercentage, 100);
  }, []);

  // Handle scroll events with performance optimizations
  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      setProgress(calculateProgress());
    });
  }, [calculateProgress]);

  useEffect(() => {
    setIsClient(true);

    if (typeof window === 'undefined') return;

    // Set initial progress
    setProgress(calculateProgress());

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Add resize event listener to handle responsive changes
    const handleResize = () => {
      requestAnimationFrame(() => {
        setProgress(calculateProgress());
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup event listeners
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateProgress, handleScroll]);

  if (!isClient) {
    // Return placeholder with same dimensions to prevent layout shift
    return (
      <div
        className={cn('top-[66px] lg:top-[86px] left-0 w-full', backgroundColor, className)}
        style={{
          height: `${height}px`,
          position,
          zIndex,
        }}
        aria-hidden="true"
      />
    );
  }

  // Securely determine position classes using allowlist approach
  const getPositionClasses = (pos: string | undefined): string => {
    const ALLOWED_POSITIONS = ['fixed', 'sticky'] as const;
    type AllowedPosition = typeof ALLOWED_POSITIONS[number];

    if (pos && ALLOWED_POSITIONS.includes(pos as AllowedPosition)) {
      const positionClassesMap = {
        fixed: 'fixed top-[66px] lg:top-[86px] left-0 w-full',
        sticky: 'sticky top-[66px] lg:top-[86px] left-0 w-full',
      };
      return positionClassesMap[pos as AllowedPosition];
    }

    // Default fallback for invalid positions
    return 'fixed top-[66px] lg:top-[86px] left-0 w-full';
  };

  const positionClasses = getPositionClasses(position);

  return (
    <div
      className={cn(positionClasses, className)}
      style={{
        height: `${height}px`,
        zIndex,
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Reading progress: ${Math.round(progress)}%`}
    >

      {/* Progress bar */}
      <div
        className={cn('h-full transition-all duration-150 ease-out', color)}
        style={{
          width: `${progress}%`,
        }}
        aria-hidden="true"
      />

      {/* Optional percentage display */}
      {showPercentage && (
        <div className="sr-only">
          {Math.round(progress)}% complete
        </div>
      )}
    </div>
  );
});

ReadingProgressBar.displayName = 'ReadingProgressBar';

export default ReadingProgressBar;