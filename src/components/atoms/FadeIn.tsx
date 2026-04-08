'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { m, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type MotionTag = 'div' | 'section' | 'li' | 'article' | 'span';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  as?: MotionTag;
}

export default function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  className,
  as: Tag = 'div',
}: Readonly<FadeInProps>) {
  const shouldReduceMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
      initial={hasMounted ? { opacity: 0, y: 20 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
