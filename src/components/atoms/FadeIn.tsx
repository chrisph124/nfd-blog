'use client';

import { type ReactNode, useSyncExternalStore } from 'react';
import { m, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type MotionTag = 'div' | 'section' | 'li' | 'article' | 'span';
type Direction = 'up' | 'down' | 'left' | 'right';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: Direction;
  className?: string;
  as?: MotionTag;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const DIRECTION_OFFSET = 24;

const directionInitial = (direction: Direction, isClient: boolean) => {
  if (!isClient) return false;
  switch (direction) {
    case 'up':    return { opacity: 0, y: DIRECTION_OFFSET };
    case 'down':  return { opacity: 0, y: -DIRECTION_OFFSET };
    case 'left':  return { opacity: 0, x: DIRECTION_OFFSET };
    case 'right': return { opacity: 0, x: -DIRECTION_OFFSET };
  }
};

export default function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  className,
  as: Tag = 'div',
}: Readonly<FadeInProps>) {
  const shouldReduceMotion = useReducedMotion();
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const getComponent = (tag: MotionTag) => {
    switch (tag) {
      case 'div': return m.div;
      case 'section': return m.section;
      case 'li': return m.li;
      case 'article': return m.article;
      case 'span': return m.span;
    }
  };

  const Component = getComponent(Tag) as React.ComponentType<HTMLMotionProps<MotionTag>>;

  if (shouldReduceMotion) {
    return <Component className={cn(className)}>{children}</Component>;
  }

  return (
    <Component
      initial={directionInitial(direction, isClient)}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
