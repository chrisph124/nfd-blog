'use client';

import { type ReactNode } from 'react';
import { m, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type MotionTag = 'div' | 'section' | 'li' | 'article' | 'span';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  as?: MotionTag;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.5,
  className,
  as: Tag = 'div',
}: Readonly<ScrollRevealProps>) {
  const shouldReduceMotion = useReducedMotion();
  const Component = m[Tag] as React.ComponentType<HTMLMotionProps<typeof Tag>>;

  if (shouldReduceMotion) {
    return <Component className={cn(className)}>{children}</Component>;
  }

  return (
    <Component
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-50px' }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
