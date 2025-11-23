import Page from "@/components/templates/Page";
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
import Cta from "@/components/atoms/Cta";
import TabItem from "@/components/molecules/TabItem";

import { apiPlugin, storyblokInit } from '@storyblok/react/rsc';

// Component mapping type
const components = {
  page: Page,
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
