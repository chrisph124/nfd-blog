"use client";

import { memo } from "react";
import {
  storyblokEditable,
  StoryblokServerComponent,
} from "@storyblok/react/rsc";
import type { HeroBlockBlok, CtaBlok, StoryblokAsset } from "@/types/storyblok";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroProps {
  blok: HeroBlockBlok;
}

interface HeroImageProps {
  image: StoryblokAsset;
  position: HeroBlockBlok["position"];
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

const HeroImage = memo(({ image, position }: HeroImageProps) => {
  const isHorizontal = position === "horizontal" || position === "horizontal-reverse";
  const imageClasses = cn("w-full shrink-0", isHorizontal ? "lg:w-1/2" : "lg:w-full");

  return (
    <figure className={imageClasses}>
      <Image
        src={image.filename}
        alt={image.alt || ""}
        width={1920}
        height={1080}
        className="w-full h-auto object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </figure>
  );
});

HeroImage.displayName = "HeroImage";

const HeroContent = memo(({
  eyebrow,
  heading,
  headingTag: HeadingTag,
  subHeading,
  ctaGroup,
  contentAlignment,
  position,
  hasImage,
}: HeroContentProps) => {
  const isHorizontal = position === "horizontal" || position === "horizontal-reverse";

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
        <h4 className="tracking-wide caption uppercase text-primary-400 -mb-5">
          {eyebrow}
        </h4>
      )}

      <HeadingTag className="font-bold text-white">{heading}</HeadingTag>

      {subHeading && <p className="text-gray-200">{subHeading}</p>}

      {ctaGroup && ctaGroup.length > 0 && (
        <section
          className={cn("flex flex-wrap gap-6 items-center", ctaAlignmentClasses)}
          aria-label="Hero CTA actions"
        >
          {ctaGroup.map((cta) => (
            <StoryblokServerComponent key={cta._uid} blok={cta} />
          ))}
        </section>
      )}
    </div>
  );
});

HeroContent.displayName = "HeroContent";

const Hero = memo(({ blok }: HeroProps) => {
  const {
    background_image,
    eyebrow,
    heading,
    heading_tag = "h1",
    sub_heading,
    image,
    cta_group,
    content_alignment = "left",
    position = "vertical",
  } = blok;

  const hasImage = !!image?.filename;
  const hasBackgroundImage = !!background_image?.filename;
  const hasContent = !!(eyebrow || heading || sub_heading || cta_group?.length);

  const getOverlayClasses = () => {
    const isHorizontal = position === "horizontal" || position === "horizontal-reverse";

    if (isHorizontal) {
      return cn(
        "absolute inset-0 bg-black/65",
        "lg:bg-transparent",
        position === "horizontal" ? "lg:bg-gradient-to-r" : "lg:bg-gradient-to-l",
        "lg:from-black lg:to-transparent"
      );
    }
    return "absolute inset-0 bg-black/65";
  };

  const getContainerClasses = () => {
    const isHorizontal = position === "horizontal" || position === "horizontal-reverse";

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
    "relative z-10 w-full h-full min-h-[250px] gap-10 lg:gap-20 px-10 py-12 lg:px-24 lg:py-20",
    getContainerClasses()
  );

  return (
    <section
      {...storyblokEditable(blok)}
      className="relative w-full min-h-[250px] overflow-hidden"
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
        {hasImage && <HeroImage image={image} position={position} />}

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
