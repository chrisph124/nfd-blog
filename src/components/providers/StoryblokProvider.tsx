"use client";

import { ReactNode } from "react";
import { initStoryblokClient } from "@/lib/storyblok-client";

interface StoryblokProviderProps {
  children: ReactNode;
}

export default function StoryblokProvider({ children }: StoryblokProviderProps) {
  // Registers the few components client components render as nested bloks.
  initStoryblokClient();
  return children;
}
