# Notes of Dev Blog

A personal blog by Hieu (Chris) Pham - notes on software engineering. Built with Next.js 16 and Storyblok CMS for seamless content management.

## Tech Stack

- **Next.js 16.2.3.0** - React framework with App Router and Server Components
- **Storyblok** - Headless CMS for content management
- **Tailwind CSS v4** - Utility-first CSS with new `@tailwindcss/postcss` plugin
- **TypeScript** - Type-safe development with strict mode
- **Turbopack** - Next-generation bundler for fast development
- **Vercel** - hosting + analytics

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm package manager
- Storyblok account with a space created

### Installation

1. Clone the repo
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   ```bash
   # .env.local
   NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN=your_token
   ```

### Development

4. Start dev server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # UI components (atoms, molecules, organisms, templates)
├── lib/              # SDK setup, utilities, API helpers
├── types/            # TypeScript types
└── __tests__/        # Vitest tests
scripts/
└── generate-types.ts  # Storyblok type generation
```

## Type Generation

Sync TypeScript types with your Storyblok components:

```bash
pnpm generate-types
```

See [scripts/README.md](scripts/README.md) for details.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint code |
| `pnpm test` | Run tests |
| `pnpm generate-types` | Sync Storyblok types |

## Security

Key security practices:
- **Regular Security Updates**: Dependencies are regularly updated and audited (`pnpm audit`)
- **Type-safe TypeScript**: strict mode, no `any`
- **CVE Patches**: All critical React CVEs are patched (see [SECURITY.md](SECURITY.md))
- **XSS Prevention**: Input sanitization and content security policies
- **Type Safety**: Strict TypeScript configuration prevents runtime errors
- **Environment Security**: Secure handling of API keys and secrets
## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Storyblok Documentation](https://www.storyblok.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

## License

MIT
