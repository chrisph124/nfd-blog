'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import type { CtaBlok } from '@/types/storyblok';

interface CTAProps {
  blok: CtaBlok;
}

const Cta = memo(({ blok }: CTAProps) => {
  const {
    label,
    navigate_to,
    cta_type = 'primary',
    cta_size = 'hug',
  } = blok;

  // Base styles
  const baseStyles = 'box-border flex gap-2 items-center justify-center font-semibold rounded-xl tracking-wide transition-all duration-200 hover:opacity-90';

  // Size variants
  const sizeStyles = {
    hug: 'px-3 py-2',
    large: 'px-12 py-6',
    full: 'w-full px-8 py-5',
  };

  // Type variants
  const typeStyles = {
    'primary': 'bg-primary-700 text-gray-50',
    'primary-reverse': 'bg-primary-50 text-primary-700',
    'primary-outlined': 'border-2 border-primary-700 text-primary-900 bg-transparent',
    'secondary': 'bg-secondary-700 text-gray-50',
    'secondary-reverse': 'bg-secondary-50 text-secondary-700',
    'secondary-outlined': 'border-2 border-secondary-700 text-secondary-900 bg-transparent',
    'link': 'bg-transparent text-primary-900 px-0 py-0 pointer no-underline hover:underline',
  };

  const className = `${baseStyles} ${sizeStyles[cta_size || 'hug']} ${typeStyles[cta_type || 'primary']}`;

  // Handle link navigation
  const href = navigate_to?.cached_url || navigate_to?.url || '#';
  const target = navigate_to?.target || '_self';
  const isExternal = navigate_to?.linktype === 'url' || href.startsWith('http');

  const isLink = cta_type === 'link';

  const content = (
    <>
      <span className="whitespace-nowrap">{label}</span>
      {isLink && <ArrowRightIcon className="size-5" />}
    </>
  );

  // Render as external link
  if (isExternal) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }

  // Render as Next.js Link for internal navigation
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
});

Cta.displayName = 'Cta';

export default Cta;
