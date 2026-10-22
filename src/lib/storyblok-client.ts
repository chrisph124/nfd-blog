import { storyblokInit } from '@storyblok/react/rsc';
import Tabs from '@/components/organisms/Tabs';
import TabItem from '@/components/molecules/TabItem';
import Cta from '@/components/atoms/Cta';

/**
 * Browser-side Storyblok registry. It lists only the components that client components render as
 * nested bloks (Tabs → TabItem → CTAs). Server components render everything else, and importing
 * the full map from `@/lib/storyblok` here shipped Shiki, the markdown pipeline and every
 * component (about 226 KB gzipped) to every reader.
 *
 * No access token: the browser never calls the Storyblok API, and any token passed here is
 * inlined into the public bundle.
 */
export const initStoryblokClient = storyblokInit({
  components: {
    tabs: Tabs,
    tab_item: TabItem,
    cta: Cta,
  },
});
