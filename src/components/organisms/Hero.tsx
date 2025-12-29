"use client";

import { memo } from "react";
import {
  makeStoryblokEditable,
  StoryblokServerComponent,
  getDimensionsFromStoryblokUrl,
} from "@/lib/storyblok-utils";
import type { HeroBlockBlok, CtaBlok, StoryblokAsset } from "@/types/storyblok";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroProps {
  blok: HeroBlockBlok;
}

interface HeroImageProps {
  image: StoryblokAsset;
  position: HeroBlockBlok["position"];
  imageType?: HeroBlockBlok["image_type"];
}

interface HeroContentProps {
  eyebrow?: string;
  heading: string;
  headingTag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  subHeading?: string;
  ctaGroup?: CtaBlok[];
  contentAlignment: HeroBlockBlok["content_alignment"];
  position: HeroBlockBlok["position"];
  hasImage: boolean;
}

const HeroImage = memo(({ image, position, imageType = "auto" }: HeroImageProps) => {
  const { width, height } = getDimensionsFromStoryblokUrl(image.filename);

  const isHorizontal = position === "horizontal" || position === "horizontal-reverse";

  // Width class calculation using mobile-first approach
  const getWidthClasses = (): string => {
    const widthClassMap: Record<NonNullable<HeroBlockBlok["image_type"]>, string> = {
      auto: "w-auto",
      full: isHorizontal ? "w-full" : "w-full lg:w-4/5",
      half: "w-full lg:w-1/2",
    };
    // eslint-disable-next-line security/detect-object-injection -- Type-safe: imageType is keyof widthClassMap
    return widthClassMap[imageType];
  };

  // Image sizes attribute for Next.js optimization
  const getImageSizes = (): string => {
    const sizesMap: Record<NonNullable<HeroBlockBlok["image_type"]>, string> = {
      auto: `${width}px`,
      full: isHorizontal
        ? "100vw"
        : "(min-width: 1024px) 80vw, 100vw",
      half: "(min-width: 1024px) 50vw, 100vw",
    };
    // eslint-disable-next-line security/detect-object-injection -- Type-safe: imageType is keyof sizesMap
    return sizesMap[imageType];
  };

  // Image className - different for auto vs full/half
  const getImageClasses = (): string => {
    return cn(
      "h-auto object-cover",
      imageType === "auto" ? `w-[${width}px] max-w-full` : "w-full"
    );
  };

  const figureClasses = cn(
    "h-auto m-auto",
    getWidthClasses()
  );

  return (
    <figure className={figureClasses}>
      <Image
        src={image.filename}
        alt={image.alt || ""}
        width={width}
        height={height}
        quality={90}
        className={getImageClasses()}
        sizes={getImageSizes()}
      />
    </figure>
  );
});

HeroImage.displayName = "HeroImage";

const HeroContent = memo(
  ({
    eyebrow,
    heading,
    headingTag: HeadingTag,
    subHeading,
    ctaGroup,
    contentAlignment,
    position,
    hasImage,
  }: HeroContentProps) => {
    const isHorizontal =
      position === "horizontal" || position === "horizontal-reverse";

    const alignmentClasses = {
      center: "items-center text-center",
      right: "items-end text-right",
      left: "items-start text-left",
    }[contentAlignment || "left"];

    const getContentColumnClasses = () => {
      if (isHorizontal) {
        if (hasImage) return "lg:w-1/2";
        return position === "horizontal-reverse"
          ? "lg:w-full lg:justify-end"
          : "lg:w-full lg:justify-start";
      }
      return "lg:w-full lg:justify-center";
    };

    const ctaAlignmentClasses = {
      center: "justify-center",
      right: "justify-end",
      left: "justify-start",
    }[contentAlignment || "left"];

    const contentClasses = cn(
      "relative w-full flex flex-col gap-5 max-w-2xl",
      alignmentClasses,
      getContentColumnClasses()
    );

    return (
      <div className={contentClasses} aria-label="Hero section content">
        {eyebrow && (
          <h4 className="tracking-wide h5 uppercase text-primary-400 -mb-3">
            {eyebrow}
          </h4>
        )}

        <HeadingTag className="font-bold text-white">{heading}</HeadingTag>

        {subHeading && <p className="text-gray-200">{subHeading}</p>}

        {ctaGroup && ctaGroup.length > 0 && (
          <section
            className={cn(
              "flex flex-wrap gap-6 items-center",
              ctaAlignmentClasses
            )}
            aria-label="Hero CTA actions"
          >
            {ctaGroup.map((cta) => (
              <StoryblokServerComponent key={cta._uid} blok={cta} />
            ))}
          </section>
        )}
      </div>
    );
  }
);

HeroContent.displayName = "HeroContent";

const Hero = memo(({ blok }: HeroProps) => {
  const {
    background_image,
    eyebrow,
    heading,
    heading_tag = "h1",
    sub_heading,
    image,
    image_type,
    cta_group,
    content_alignment = "left",
    position = "vertical",
  } = blok;

  const hasImage = !!image?.filename;
  const hasBackgroundImage = !!background_image?.filename;
  const hasContent = !!(eyebrow || heading || sub_heading || cta_group?.length);

  const getOverlayClasses = () => {
    const isHorizontal =
      position === "horizontal" || position === "horizontal-reverse";

    if (isHorizontal) {
      return cn(
        "absolute inset-0 bg-black/75",
        "lg:bg-transparent",
        position === "horizontal"
          ? "lg:bg-gradient-to-r"
          : "lg:bg-gradient-to-l",
        "lg:from-black lg:to-transparent"
      );
    }
    return "absolute inset-0 bg-black/75";
  };

  const getContainerClasses = () => {
    const isHorizontal =
      position === "horizontal" || position === "horizontal-reverse";

    if (isHorizontal) {
      return cn(
        "flex flex-col",
        position === "horizontal" ? "lg:flex-row-reverse" : "lg:flex-row"
      );
    }
    return cn(
      "flex flex-col",
      position === "vertical"
        ? "lg:flex-col-reverse lg:justify-center lg:items-center"
        : "lg:flex-col lg:justify-center lg:items-center"
    );
  };

  const containerClasses = cn(
    "relative z-10 w-full max-w-[1280px] h-full min-h-[250px] gap-10 px-10 py-12 lg:px-15 xl:px-5 lg:py-15 mx-auto",
    getContainerClasses()
  );

  return (
    <section
      {...makeStoryblokEditable(blok)}
      className="relative w-full min-h-[250px] overflow-hidden -mt-10"
    >
      {hasBackgroundImage && (
        <>
          <div className="absolute inset-0 z-0">
            <Image
              src={background_image.filename}
              alt={background_image.alt || ""}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
          <div className={getOverlayClasses()} />
        </>
      )}

      <div className={containerClasses}>
        {hasImage && <HeroImage image={image} position={position} imageType={image_type} />}

        {hasContent && (
          <HeroContent
            eyebrow={eyebrow}
            heading={heading}
            headingTag={heading_tag}
            subHeading={sub_heading}
            ctaGroup={cta_group}
            contentAlignment={content_alignment}
            position={position}
            hasImage={hasImage}
          />
        )}
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;
