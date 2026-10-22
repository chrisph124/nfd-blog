import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self' https://app.storyblok.com",
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

// Renamed posts keep their old URLs alive for search engines. `statusCode: 301`
// (not `permanent: true`, which emits 308) matches what Search Console expects;
// config redirects run before the proxy, so `/posts/{old}` lands here too.
const renamedPosts: Record<string, string> = {
  'the-goldfish-problem-why-your-ai-forgets-everything-the-moment-you-close-the-tab':
    'why-your-ai-forgets-your-project',
  'how-one-file-in-your-project-root-changes-everything-about-ai-coding':
    'give-your-ai-a-context-file',
  'the-tools-behind-every-ai-workflow-that-actually-works':
    'pick-the-right-ai-workflow-framework',
  'your-ai-just-introduced-a-cve-and-nobody-noticed':
    'ai-generated-code-ships-hidden-vulnerabilities',
  'harness-engineering-the-discipline-after-the-hype':
    'harness-engineering-proves-your-ai-works',
  'dawn-of-a-new-era-or-the-slow-fade-of-everything-we-took-for-granted':
    'ai-is-changing-work-and-thinking',
  'how-to-actually-live-in-an-obsidian-vault':
    'daily-loop-for-obsidian-vaults',
};

const nextConfig: NextConfig = {
  // Type-check app code only during `next build`. From 16.3 the build also
  // reports type errors in vitest test files, which 16.2 did not; tests are
  // not part of the production bundle.
  typescript: {
    tsconfigPath: 'tsconfig.build.json',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.storyblok.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a2.storyblok.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return Object.entries(renamedPosts).flatMap(([oldSlug, newSlug]) => [
      { source: `/${oldSlug}`, destination: `/${newSlug}`, statusCode: 301 },
      { source: `/posts/${oldSlug}`, destination: `/${newSlug}`, statusCode: 301 },
    ]);
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
