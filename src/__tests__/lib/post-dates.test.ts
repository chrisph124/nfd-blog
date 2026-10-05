import { describe, it, expect } from 'vitest';
import { getModifiedDate, getUpdatedDate } from '@/lib/post-dates';
import type { PostBlok, StoryblokStory } from '@/types/storyblok';

const FIRST_PUBLISHED = '2026-04-08T00:00:00.000Z';
const CREATED = '2026-04-01T00:00:00.000Z';
const BULK_REPUBLISH = '2026-08-05T07:04:35.000Z';

const createStory = (
  updatedOn: string | undefined,
  firstPublished: string | null = FIRST_PUBLISHED
): StoryblokStory<PostBlok> => ({
  id: 1,
  uuid: 'uuid',
  name: 'Post',
  slug: 'post',
  full_slug: 'posts/post',
  created_at: CREATED,
  published_at: BULK_REPUBLISH,
  first_published_at: firstPublished,
  content: { _uid: 'p', component: 'post', updated_on: updatedOn },
  position: 0,
  tag_list: [],
  is_startpage: false,
  parent_id: null,
  meta_data: null,
  group_id: 'g',
  release_id: null,
  lang: 'en',
  path: '/posts/post',
  alternates: [],
  default_full_slug: null,
  translated_slugs: null,
});

describe('post dates never follow published_at', () => {
  it.each([
    ['unset', undefined, FIRST_PUBLISHED, undefined, FIRST_PUBLISHED],
    ['empty Storyblok date field', '', FIRST_PUBLISHED, undefined, FIRST_PUBLISHED],
    ['whitespace', '   ', FIRST_PUBLISHED, undefined, FIRST_PUBLISHED],
    ['Storyblok date-only value, read as UTC', '2026-10-05 00:00', FIRST_PUBLISHED, '2026-10-05T00:00:00.000Z', '2026-10-05T00:00:00.000Z'],
    ['ISO value with an offset', '2026-09-01T12:30:00+07:00', FIRST_PUBLISHED, '2026-09-01T05:30:00.000Z', '2026-09-01T05:30:00.000Z'],
    ['unparseable value', 'next week', FIRST_PUBLISHED, undefined, FIRST_PUBLISHED],
    ['value before the first publish', '2026-04-01 00:00', FIRST_PUBLISHED, undefined, FIRST_PUBLISHED],
    ['never published, unset', undefined, null, undefined, CREATED],
  ])('%s', (_label, updatedOn, firstPublished, expectedUpdated, expectedModified) => {
    const story = createStory(updatedOn, firstPublished);

    expect(getUpdatedDate(story)).toBe(expectedUpdated);
    expect(getModifiedDate(story)).toBe(expectedModified);
  });
});
