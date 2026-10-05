import Image from 'next/image';
import Link from 'next/link';
import { AUTHOR_BIO, AUTHOR_IMAGE, AUTHOR_NAME } from '@/lib/seo/author';
import { formatDate } from '@/lib/utils';
import type { PostCardData } from '@/lib/post-card';

export interface RelatedPostCards {
  tag?: { name: string; slug: string };
  posts: PostCardData[];
}

interface PostEndingsProps {
  related?: RelatedPostCards;
}

interface RelatedPostsProps {
  related: RelatedPostCards;
}

const AuthorCard = () => (
  <aside
    aria-label="About the author"
    className="flex items-start gap-4 rounded-xl border border-gray-200 p-5"
  >
    <Image
      src={AUTHOR_IMAGE.src}
      alt={AUTHOR_IMAGE.alt}
      width={64}
      height={64}
      className="size-16 shrink-0 rounded-full object-cover"
    />
    <div className="flex flex-col gap-1">
      <p className="font-bold text-foreground">{AUTHOR_NAME}</p>
      <p className="text-gray-600">{AUTHOR_BIO}</p>
      <Link href="/about" className="w-fit font-semibold">
        About me
      </Link>
    </div>
  </aside>
);

const RelatedPosts = ({ related }: RelatedPostsProps) => (
  <section aria-labelledby="related-posts-heading" className="flex flex-col gap-4">
    <h2 id="related-posts-heading">
      {related.tag ? (
        <>
          More on <Link href={`/tags/${related.tag.slug}`}>{related.tag.name}</Link>
        </>
      ) : (
        'Latest posts'
      )}
    </h2>
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {related.posts.map((post) => (
        <li key={post.uuid} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
          <Link href={post.href} className="font-semibold">
            {post.title}
          </Link>
          <span className="text-sm text-gray-500">
            {formatDate(post.date)} <span aria-hidden="true">•</span> {post.readingTime}
          </span>
        </li>
      ))}
    </ul>
  </section>
);

// A route handler, not a page, so a plain anchor (no client-side navigation).
const FollowLink = () => (
  <p className="text-gray-600">
    <a href="/rss.xml">Follow via RSS</a> to get new posts as they land.
  </p>
);

export default function PostEndings({ related }: Readonly<PostEndingsProps>) {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 xl:px-5 mt-12 md:mt-16">
      <div className="max-w-5xl mx-auto flex flex-col gap-10 border-t border-gray-200 pt-10">
        <AuthorCard />
        {related && related.posts.length > 0 && <RelatedPosts related={related} />}
        <FollowLink />
      </div>
    </div>
  );
}
