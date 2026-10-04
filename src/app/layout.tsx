import type { Metadata, Viewport } from "next";
import { Nunito, Lora, Bitcount_Prop_Single } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import StoryblokProvider from "@/components/providers/StoryblokProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import MotionProvider from "@/components/providers/MotionProvider";
import { getSiteUrl, getStoryblokApi, storyblokVersion } from "@/lib/storyblok";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});

const bitcountPropSingle = Bitcount_Prop_Single({
  variable: "--font-bitcount-prop-single",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'Notes of Dev — Frontend Engineering, AI & CMS Notes', template: '%s | Notes of Dev' },
  description: 'A working notebook on frontend engineering, AI workflows, and headless CMS architecture — research, experiments, and patterns from building real interfaces.',
  openGraph: {
    type: 'website',
    siteName: 'Notes of Dev',
    locale: 'en_US',
    url: getSiteUrl(),
  },
  twitter: {
    card: 'summary_large_image',
    site: '@chrisphamdev',
    creator: '@chrisphamdev',
  },
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [{ url: '/rss.xml', title: 'Notes of Dev' }],
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let headerStory = null;
    let footerStory = null;

    try {
      const storyblokApi = getStoryblokApi();
      const [headerData, footerData] = await Promise.all([
        storyblokApi.get('cdn/stories/global/header', { version: storyblokVersion }),
        storyblokApi.get('cdn/stories/global/footer', { version: storyblokVersion }),
      ]);
      headerStory = headerData.data.story;
      footerStory = footerData.data.story;
    } catch (error) {
      console.error('Error fetching global components:', error);
    }


  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
        <body className={`${nunito.variable} ${bitcountPropSingle.variable} ${lora.variable} antialiased flex flex-col min-h-full`}>
          {/* z-[60] keeps it above the sticky header (z-50) and reading-progress bar. */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] rounded-md bg-background px-4 py-2"
          >
            Skip to content
          </a>
          <ThemeProvider>
            <StoryblokProvider>
              <MotionProvider>
                {headerStory && <Header blok={headerStory.content.body[0]} />}
                {/* scroll-mt clears the sticky header (h-[70px] lg:h-[90px]) when the skip link scrolls here. */}
                <main id="main-content" tabIndex={-1} className="grow py-10 overflow-x-hidden focus:outline-none scroll-mt-[70px] lg:scroll-mt-[90px]">
                  {children}
                </main>
                {footerStory && <Footer blok={footerStory.content.body[0]} />}
              </MotionProvider>
            </StoryblokProvider>
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
  );
}
