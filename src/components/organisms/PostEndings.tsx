import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { PostCardData } from '@/lib/post-card';

export interface RelatedPostCards {
  tag?: { name: string; slug: string };
  posts: PostCardData[];
}

interface PostEndingsProps {
  related?: RelatedPostCards;
}

interface RelatedPostCardProps {
  post: PostCardData;
}

// The title link stretches over the card, so the thumbnail needs no link and is decorative (alt="").
const RelatedPostCard = ({ post }: RelatedPostCardProps) => (
  <li className="group relative flex gap-4 rounded-xl border border-gray-200 p-4 transition-shadow duration-300 hover:shadow-lg has-[a:focus-visible]:shadow-lg dark:shadow-white/15">
    {post.image && (
      <div className="relative hidden min-[992px]:block w-32 shrink-0 self-start aspect-video overflow-hidden rounded-lg">
        <Image
          src={post.image.src}
          alt=""
          fill
          sizes="128px"
          className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105 motion-safe:group-has-[a:focus-visible]:scale-105"
        />
      </div>
    )}
    <div className="flex min-w-0 flex-col gap-2">
      <Link href={post.href} className="font-semibold no-underline! after:absolute after:inset-0">
        {post.title}
      </Link>
      <span className="text-sm text-gray-500">
        {formatDate(post.date)} <span aria-hidden="true">•</span> {post.readingTime}
      </span>
    </div>
  </li>
);

export default function PostEndings({ related }: Readonly<PostEndingsProps>) {
  if (!related?.posts.length) return null;

  return (
    <section
      aria-labelledby="related-posts-heading"
      className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 xl:px-5 mt-12 md:mt-16"
    >
      <div className="flex flex-col gap-4 border-t border-gray-200 pt-10">
        {/* Deliberately an h3 styled as h2; the `!` utilities mirror the global `h2:not(...)` rule. */}
        <h3 id="related-posts-heading" className="h2 tracking-[inherit]! text-(--rose-700)! dark:text-(--rose-500)!">
          {related.tag ? (
            <>
              More on <Link href={`/tags/${related.tag.slug}`}>{related.tag.name}</Link>
            </>
          ) : (
            'Latest posts'
          )}
        </h3>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {related.posts.map((post) => (
            <RelatedPostCard key={post.uuid} post={post} />
          ))}
        </ul>
      </div>
    </section>
  );
}
