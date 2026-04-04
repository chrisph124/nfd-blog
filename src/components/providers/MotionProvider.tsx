'use client';

import { LazyMotion, domAnimation } from 'motion/react';

interface MotionProviderProps {
  children: React.ReactNode;
}

export default function MotionProvider({ children }: Readonly<MotionProviderProps>) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
