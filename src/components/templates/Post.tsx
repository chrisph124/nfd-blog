import Image from 'next/image';
import { StoryblokServerComponent } from '@storyblok/react/rsc';
import type { PostBlok } from '@/types/storyblok';

interface PostProps {
  blok: PostBlok;
}

export default function Post({ blok }: Readonly<PostProps>) {
  const { title = '', featured_image, excerpt, body } = blok;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {featured_image?.filename && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-8">
          <Image
            src={featured_image.filename}
            alt={featured_image.alt || title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
          />
        </div>
      )}

      <header className="mb-8">
        {title && <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>}
        {excerpt && (
          <p className="text-xl text-gray-600 leading-relaxed">{excerpt}</p>
        )}
      </header>

      {body && body.length > 0 && (
        <div className="prose prose-lg max-w-none flex flex-col gap-y-6">
          {body.map((nestedBlok) => (
            <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
          ))}
        </div>
      )}
    </article>
  );
}
