'use client';

import { memo } from 'react';
import Link from 'next/link';
import { HiArrowUpRight } from "react-icons/hi2";
import type { CtaBlok } from '@/types/storyblok';
import { normalizeStoryblokUrl, cn } from '@/lib/utils';

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
  const baseWrapperStyles = 'group rounded-2xl transition-all duration-300 transition-opacity';
  const baseTextStyles = 'box-border flex gap-2 items-center justify-center font-semibold rounded-2xl tracking-wide text-transparent bg-clip-text bg-linear-to-r transition-all duration-300 transition-opacity';

  // Size variants
  const sizeStyles = {
    hug: 'px-4 py-3',
    large: 'px-12 py-6',
    full: 'w-full px-8 py-5',
  };

  const wrapperHoverStyles = `hover:bg-primary-50 hover:border-transparent`
  const wrapperHoverSecondaryStyles = `hover:bg-secondary-50 hover:border-transparent`
  const primaryHoverStyles = `group-hover:from-primary-700 group-hover:to-secondary-900`
  const secondaryHoverStyles = `group-hover:from-secondary-700 group-hover:to-secondary-900`

  // Type variants
  const textStyles = {
    'primary': `from-primary-50 to-primary-50 ${primaryHoverStyles}`,
    'primary-reverse': `from-primary-700 to-primary-700 ${primaryHoverStyles}`,
    'primary-outlined': `from-primary-400 to-primary-400 ${primaryHoverStyles}`,
    'secondary': `from-secondary-50 to-secondary-50 ${secondaryHoverStyles}`,
    'secondary-reverse': `from-secondary-700 to-secondary-700 ${secondaryHoverStyles}`,
    'secondary-outlined': `from-secondary-400 to-secondary-400 ${secondaryHoverStyles}`,
    'link': `from-primary-700 to-primary-900 pointer px-0 py-0`,
  };

  const wrapperStyles = {
    'primary': `bg-primary-700 ${wrapperHoverStyles}`,
    'primary-reverse': `bg-primary-50 ${wrapperHoverStyles}`,
    'primary-outlined': `border-2 border-primary-400 bg-transparent ${wrapperHoverStyles}`,
    'secondary': `bg-secondary-700 ${wrapperHoverSecondaryStyles}`,
    'secondary-reverse': `bg-secondary-50 ${wrapperHoverSecondaryStyles}`,
    'secondary-outlined': `border-2 border-secondary-400 bg-transparent ${wrapperHoverSecondaryStyles}`,
    'link': `bg-transparent no-underline hover:underline hover:decoration-primary-700 p-0`,
  }

  const textClasses = `${baseTextStyles} ${sizeStyles[cta_size || 'hug']} ${textStyles[cta_type || 'primary']}`;
  const wrapperClasses = `${wrapperStyles[cta_type || 'primary']}`;

  // Handle link navigation
  const rawUrl = navigate_to?.cached_url || navigate_to?.url;
  const href = normalizeStoryblokUrl(rawUrl);
  const target = navigate_to?.target || '_self';
  const isExternal = navigate_to?.linktype === 'url' || href.startsWith('http');

  const isLink = cta_type === 'link';

  const content = (
    <>
      <span className="whitespace-nowrap">{label}</span>
      {isLink && <HiArrowUpRight className="size-5 text-primary-900" />}
    </>
  );

  // Render as external link
  if (isExternal) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={cn(baseWrapperStyles, wrapperClasses)}
      >
        <span className={cn(textClasses, "cta-text")}>{content}</span>
      </Link>
    );
  }

  // Render as Next.js Link for internal navigation
  return (
    <Link href={href} className={cn(baseWrapperStyles, wrapperClasses)}>
      <span className={cn(textClasses, "cta-text")}>{content}</span>
    </Link>
  );
});

Cta.displayName = 'Cta';

export default Cta;
