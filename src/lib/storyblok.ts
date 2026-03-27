import Page from "@/components/templates/Page";
import Post from "@/components/templates/Post";
import Feature from "@/components/molecules/Feature";
import Grid from "@/components/organisms/Grid";
import Teaser from "@/components/molecules/Teaser";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import NavItem from "@/components/molecules/NavItem";
import SubNavItem from "@/components/molecules/SubNavItem";
import Hero from "@/components/organisms/Hero";
import Tabs from "@/components/organisms/Tabs";
import SectionWrapper from "@/components/organisms/SectionWrapper";
import TabItem from "@/components/molecules/TabItem";
import Cta from "@/components/atoms/Cta";
import Richtext from "@/components/atoms/Richtext";
import Media from "@/components/atoms/Media";
import CardItem from "@/components/molecules/CardItem";
import PostList from "@/components/organisms/PostList";

import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

// Component mapping type
const components = {
  page: Page,
  post: Post,
  feature: Feature,
  grid: Grid,
  teaser: Teaser,
  header: Header,
  footer: Footer,
  nav_item: NavItem,
  sub_nav_item: SubNavItem,
  hero_block: Hero,
  tabs: Tabs,
  tab_item: TabItem,
  section_wrapper: SectionWrapper,
  cta: Cta,
  richtext: Richtext,
  media: Media,
  card_item: CardItem,
  post_list: PostList,
} as const;

// Server-side initialization with access token
export const getStoryblokApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN as string,
  use: [apiPlugin],
  components,
  apiOptions: {
    region: 'eu'
  },
});
