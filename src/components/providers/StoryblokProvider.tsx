"use client";

import { ReactNode } from "react";
import { getStoryblokApi } from "@/lib/storyblok";

interface StoryblokProviderProps {
  children: ReactNode;
}

export default function StoryblokProvider({ children }: StoryblokProviderProps) {
  // Initialize Storyblok for client-side (visual editor support)
  getStoryblokApi();
  return children;
}
