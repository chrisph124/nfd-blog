import { storyblokInit } from '@storyblok/react/rsc';
import Tabs from '@/components/organisms/Tabs';
import TabItem from '@/components/molecules/TabItem';
import Cta from '@/components/atoms/Cta';

/**
 * Browser-side Storyblok registry. It lists only the components that client components render as
 * nested bloks (Tabs → TabItem → CTAs). Server components render everything else, and importing
 * the full map from `@/lib/storyblok` here shipped Shiki, the markdown pipeline and every
 * component (about 226 KB gzipped) to every reader.
 */
export const initStoryblokClient = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN as string,
  components: {
    tabs: Tabs,
    tab_item: TabItem,
    cta: Cta,
  },
});
