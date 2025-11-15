# NFD Blog

A modern blog application built with Next.js 15 and Storyblok CMS for seamless content management.

## Tech Stack

- **Next.js 15.3.0** - React framework with App Router and Server Components
- **Storyblok** - Headless CMS for content management
- **Tailwind CSS v4** - Utility-first CSS with new `@tailwindcss/postcss` plugin
- **TypeScript** - Type-safe development with strict mode
- **Turbopack** - Next-generation bundler for fast development

## Features

- 🚀 Server-side rendering with React Server Components
- 📝 Content management via Storyblok CMS
- 🎨 Component-based architecture with Storyblok integration
- 🔄 Auto-generated TypeScript types from Storyblok schemas
- 🎯 Type-safe with strict TypeScript configuration
- ⚡ Fast development with Turbopack

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Storyblok account with a space created

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd nfd-blog
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a `.env.local` file in the root directory:
   ```bash
   # Required for content fetching
   NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN=your_content_api_token

   # Required for type generation (optional)
   STORYBLOK_MANAGEMENT_TOKEN=your_management_token
   STORYBLOK_SPACE_ID=your_space_id
   ```

   Get your tokens from Storyblok:
   - Content API Token: Settings → Access Tokens → Content Delivery
   - Management Token: Settings → Access Tokens → Personal Access Tokens
   - Space ID: Settings → General

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
nfd-blog/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── [...slug]/    # Dynamic catch-all route for Storyblok pages
│   │   ├── layout.tsx    # Root layout with StoryblokProvider
│   │   └── page.tsx      # Homepage
│   ├── components/       # Storyblok components (JSX)
│   │   ├── Page.jsx      # Page container component
│   │   ├── Feature.jsx   # Feature block component
│   │   ├── Grid.jsx      # Grid layout component
│   │   └── Teaser.jsx    # Teaser card component
│   ├── lib/              # Utilities and SDK setup
│   │   └── storyblok.js  # Storyblok SDK initialization
│   └── types/            # TypeScript type definitions
│       └── storyblok.ts  # Auto-generated Storyblok types
├── scripts/              # Utility scripts
│   └── generate-types.ts # Type generation from Storyblok schemas
├── CLAUDE.md             # AI assistant instructions
└── STORYBLOK_SETUP_GUIDE.md  # Storyblok setup documentation
```

## Type Generation

This project includes automatic TypeScript type generation from Storyblok component schemas:

```bash
npm run generate-types
```

This fetches all component definitions from Storyblok and generates type-safe interfaces in `src/types/storyblok.ts`.

See [scripts/README.md](scripts/README.md) for details.

## Adding New Components

1. Create component in Storyblok (via the CMS interface)
2. Create corresponding React component in `src/components/`
3. Register component in `src/lib/storyblok.js`
4. Run `npm run generate-types` to update TypeScript types
5. Use the component in your pages

Example:
```jsx
// src/components/MyComponent.jsx
export default function MyComponent({ blok }) {
  return (
    <div>
      <h2>{blok.title}</h2>
      <p>{blok.description}</p>
    </div>
  );
}
```

## Code Style

- Never use `any` type in TypeScript - use `unknown` or `never` instead
- Components use JSX (`.jsx`) while pages use TSX (`.tsx`)
- Follow the component patterns in `CLAUDE.md`

## Documentation

- [scripts/README.md](scripts/README.md) - Type generation script documentation

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Storyblok Documentation](https://www.storyblok.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

## License

MIT
