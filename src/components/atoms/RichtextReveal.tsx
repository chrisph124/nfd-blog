'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface RichtextRevealProps {
  children: ReactNode;
}

export default function RichtextReveal({ children }: Readonly<RichtextRevealProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Select media elements but skip img/video inside figure (figure handles reveal for its children)
    const mediaElements = container.querySelectorAll(
      'figure, img:not(figure img), video:not(figure video), iframe'
    );
    if (mediaElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '-50px' }
    );

    mediaElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
