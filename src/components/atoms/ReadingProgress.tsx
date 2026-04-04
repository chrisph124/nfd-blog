'use client';

import { memo } from 'react';
import { useScroll, useSpring } from 'motion/react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';

interface ReadingProgressBarProps {
  height?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
  position?: 'fixed' | 'sticky';
  zIndex?: number;
}

const ReadingProgressBar = memo<ReadingProgressBarProps>(({
  height = 4,
  className,
  color = 'bg-gradient-to-r from-secondary-400 to-neon-cyan-400',
  backgroundColor = 'bg-gray-200',
  position = 'fixed',
  zIndex = 40,
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const positionClasses = {
    fixed: 'fixed top-[70px] lg:top-[90px] left-0 w-full',
    sticky: 'sticky top-[70px] lg:top-[90px] left-0 w-full',
  }[position] || 'fixed top-[70px] lg:top-[90px] left-0 w-full';

  return (
    <div
      className={cn(positionClasses, backgroundColor, className)}
      style={{ height: `${height}px`, zIndex }}
      role="progressbar"
      aria-label="Reading progress"
    >
      <m.div
        className={cn('h-full origin-left', color)}
        style={{ scaleX }}
      />
    </div>
  );
});

ReadingProgressBar.displayName = 'ReadingProgressBar';

export default ReadingProgressBar;
