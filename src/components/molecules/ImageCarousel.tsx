'use client';

import { memo, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { cn } from '@/lib/utils';
import type { StoryblokAsset } from '@/types/storyblok';

interface ImageCarouselProps {
  images: StoryblokAsset[];
  hideOnMobile?: boolean;
}

const ImageCarousel = memo(({ images, hideOnMobile }: ImageCarouselProps) => {
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplayPlugin.current]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const handleMouseEnter = useCallback(() => {
    // Pause autoplay on hover — handled via emblaApi for testability
    const autoplay = emblaApi?.plugins?.()?.autoplay;
    if (autoplay) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (autoplay as any).stop();
    }
  }, [emblaApi]);

  const handleMouseLeave = useCallback(() => {
    // Resume autoplay on leave — handled via emblaApi for testability
    const autoplay = emblaApi?.plugins?.()?.autoplay;
    if (autoplay) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (autoplay as any).play();
    }
  }, [emblaApi]);

  // Single image — static display
  if (images.length === 1) {
    const image = images[0];
    return (
      <div
        className={cn('mt-auto overflow-hidden rounded-3xl', hideOnMobile && 'hidden md:block')}
      >
        <div className="group relative aspect-video w-full overflow-hidden border-10 border-white rounded-3xl">
          <Image
            src={image.filename}
            alt={image.alt || image.title || ''}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    );
  }

  // Multiple images — Embla carousel
  return (
    <div
      className={cn('mt-auto overflow-hidden border-10 border-white rounded-3xl', hideOnMobile && 'hidden md:block')}
    >
      <div
        ref={emblaRef}
        className="rounded-3xl overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex">
          {images.map((image) => (
            <div key={image.id} className="flex-[0_0_100%]">
              <div className="group relative aspect-video w-full overflow-hidden">
                <Image
                  src={image.filename}
                  alt={image.alt || image.title || ''}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow navigation */}
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <button
          type="button"
          onClick={scrollPrev}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/80 text-gray-900 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          aria-label="Previous image"
        >
          <HiChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/80 text-gray-900 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          aria-label="Next image"
        >
          <HiChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
});

ImageCarousel.displayName = 'ImageCarousel';

export default ImageCarousel;
