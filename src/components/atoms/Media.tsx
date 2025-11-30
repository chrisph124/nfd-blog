import { storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import Link from 'next/link';
import type { MediaBlok, StoryblokLink } from '@/types/storyblok';

// ============================================================================
// Constants
// ============================================================================

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'] as const;
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp'] as const;

const ASPECT_RATIO_CLASSES = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]',
  auto: '',
} as const;

type AspectRatio = keyof typeof ASPECT_RATIO_CLASSES;

const YOUTUBE_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
const YOUTUBE_ID_LENGTH = 11;

// ============================================================================
// Utility Functions
// ============================================================================

const isVideoFile = (filename: string): boolean =>
  VIDEO_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));

const isImageFile = (filename: string): boolean =>
  IMAGE_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));

const getYouTubeId = (url: string): string | null => {
  const match = YOUTUBE_REGEX.exec(url);
  return match?.[2]?.length === YOUTUBE_ID_LENGTH ? match[2] : null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const getAspectRatioClass = (aspectRatio: string, defaultClass = ''): string => {
  // Safe object access with type validation
  if (aspectRatio in ASPECT_RATIO_CLASSES) {
    return ASPECT_RATIO_CLASSES[aspectRatio as AspectRatio];
  }
  return defaultClass;
};

const buildEmbedParams = (autoplay: boolean, loop: boolean, muted: boolean, controls: boolean): string =>
  `autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${muted ? 1 : 0}&controls=${controls ? 1 : 0}`;

// ============================================================================
// Sub-Components
// ============================================================================

interface CaptionProps {
  caption: string;
}

const Caption = ({ caption }: CaptionProps) => (
  <figcaption className="mt-3 text-sm text-gray-600 text-center italic">
    {caption}
  </figcaption>
);

interface MediaWrapperProps {
  link?: StoryblokLink;
  children: React.ReactNode;
}

const MediaWrapper = ({ link, children }: MediaWrapperProps) => {
  if (!link?.cached_url && !link?.url) return <>{children}</>;

  const href = link.cached_url || link.url || '#';
  const target = link.target || '_self';
  const isExternal = link.linktype === 'url' || href.startsWith('http');

  if (isExternal) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className="block"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className="block">
      {children}
    </Link>
  );
};

interface VideoEmbedProps {
  youtubeUrl: string;
  title: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
}

const VideoEmbed = ({ youtubeUrl, title, autoplay, loop, muted, controls }: VideoEmbedProps) => {
  const params = buildEmbedParams(autoplay, loop, muted, controls);
  const videoId = getYouTubeId(youtubeUrl);

  if (!videoId) return null;

  return (
    <iframe
      className="absolute inset-0 w-full h-full"
      src={`https://www.youtube.com/embed/${videoId}?${params}`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

interface VideoFileProps {
  filename: string;
  altText: string;
  caption?: string;
  aspectRatio: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  posterImage?: string;
  blok: MediaBlok;
}

const VideoFile = ({ filename, altText, caption, aspectRatio, autoplay, loop, muted, controls, posterImage, blok }: VideoFileProps) => (
  <figure {...storyblokEditable(blok)} className="group">
    <div className={`relative w-full overflow-hidden rounded-xl ${getAspectRatioClass(aspectRatio, 'aspect-video')}`}>
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        poster={posterImage}
        aria-label={altText}
      >
        <source src={filename} type="video/mp4" />
        {caption && <track kind="captions" label={caption} />}
        Your browser does not support the video tag.
      </video>
    </div>
    {caption && <Caption caption={caption} />}
  </figure>
);

interface ImageFileProps {
  filename: string;
  altText: string;
  caption?: string;
  aspectRatio: string;
  isExternalUrl: boolean;
  link?: StoryblokLink;
  blok: MediaBlok;
}

const ImageFile = ({ filename, altText, caption, aspectRatio, isExternalUrl, link, blok }: ImageFileProps) => {
  const shouldFillContainer = aspectRatio !== 'auto';
  const hoverEffect = link ? 'group-hover:scale-105' : '';

  const imageContent = (
    <figure {...storyblokEditable(blok)} className="group">
      <div className={`relative w-full overflow-hidden rounded-xl ${getAspectRatioClass(aspectRatio)}`}>
        <Image
          src={filename}
          alt={altText}
          fill={shouldFillContainer}
          width={shouldFillContainer ? undefined : 1200}
          height={shouldFillContainer ? undefined : 800}
          className={`${shouldFillContainer ? 'object-cover' : 'w-full h-auto'} transition-transform duration-300 ${hoverEffect}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          unoptimized={isExternalUrl}
        />
      </div>
      {caption && <Caption caption={caption} />}
    </figure>
  );

  return <MediaWrapper link={link}>{imageContent}</MediaWrapper>;
};

// ============================================================================
// Main Component
// ============================================================================

interface MediaProps {
  blok: MediaBlok;
}

export default function Media({ blok }: Readonly<MediaProps>) {
  const {
    media_file,
    poster_image,
    autoplay = false,
    loop = false,
    muted = false,
    controls = true,
    link,
    aspect_ratio = 'auto',
  } = blok;

  // Guard clause for missing media file
  if (!media_file?.filename) return null;

  const { filename, alt, title, is_external_url } = media_file;
  const altText = alt || title || 'Media';
  const caption = title || undefined;

  // Check if it's a YouTube URL
  if (is_external_url && isYouTubeUrl(filename)) {
    return (
      <figure {...storyblokEditable(blok)} className="group">
        <div className={`relative w-full overflow-hidden rounded-xl ${getAspectRatioClass(aspect_ratio, 'aspect-video')}`}>
          <VideoEmbed
            youtubeUrl={filename}
            title={altText}
            autoplay={autoplay}
            loop={loop}
            muted={muted}
            controls={controls}
          />
        </div>
        {caption && <Caption caption={caption} />}
      </figure>
    );
  }

  // Render video file
  if (isVideoFile(filename)) {
    return (
      <VideoFile
        filename={filename}
        altText={altText}
        caption={caption}
        aspectRatio={aspect_ratio}
        autoplay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        posterImage={poster_image?.filename}
        blok={blok}
      />
    );
  }

  // Render image file
  if (isImageFile(filename)) {
    return (
      <ImageFile
        filename={filename}
        altText={altText}
        caption={caption}
        aspectRatio={aspect_ratio}
        isExternalUrl={is_external_url || false}
        link={link}
        blok={blok}
      />
    );
  }

  return null;
}
