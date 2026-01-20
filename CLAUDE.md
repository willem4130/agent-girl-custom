# Next.js Fullstack Template

Minimal, production-ready Next.js template with tRPC, Prisma, and shadcn/ui. Built for rapid fullstack development.

**Stack**: Next.js 16 + tRPC + Prisma + PostgreSQL + shadcn/ui + TypeScript

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Update DATABASE_URL in .env, then push schema
npm run db:push

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard
│   │   ├── dashboard/            # Overview & stats
│   │   ├── users/                # User management
│   │   └── settings/             # App settings
│   └── api/                      # API routes
│       └── trpc/                 # tRPC endpoint
├── server/
│   └── api/
│       ├── routers/              # tRPC routers
│       │   ├── users.ts          # User operations
│       │   └── settings.ts       # App settings
│       ├── root.ts               # Main router
│       └── trpc.ts               # tRPC configuration
├── lib/                          # Utilities & helpers
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── admin/                    # Admin components
└── prisma/
    └── schema.prisma             # Database schema (5 models)
```

## Database Models

**Authentication** (NextAuth):
- `User` - User accounts with email & role
- `Account` - OAuth provider accounts
- `Session` - Active user sessions
- `VerificationToken` - Email verification tokens

**Application**:
- `AppSettings` - Global app configuration

## Code Quality - Run After Every Edit

After editing ANY file, run these commands:

```bash
# 1. Type check (CRITICAL - catches 90% of bugs)
npm run typecheck

# 2. Lint (optional but recommended)
npm run lint

# 3. Format check (optional)
npm run format:check
```

If you make schema changes:
```bash
npm run db:push          # Push to database
npm run db:generate      # Regenerate Prisma client
npm run typecheck        # Verify no type errors
```

## Key Commands

```bash
# Development
npm run dev                        # Start dev server (Turbopack)
npm run build                      # Build for production
npm run start                      # Start production server

# Database
npm run db:push                    # Push schema changes
npm run db:generate                # Regenerate Prisma client
npm run db:migrate                 # Create migration
npm run db:studio                  # Open Prisma Studio

# Code Quality
npm run typecheck                  # Type check (no errors = safe to commit)
npm run lint                       # Run ESLint
npm run format                     # Format with Prettier
npm run format:check               # Check formatting

# Testing
npm run test                       # Run Vitest tests
npm run test:ui                    # Vitest UI
npm run test:e2e                   # Playwright E2E tests
```

## Organization Rules

Follow these patterns for consistency:

- **API routes** → `src/server/api/routers/` (one router per domain)
- **Business logic** → `src/lib/` (pure functions, utilities)
- **UI components** → `src/components/` (`ui/` for shadcn, `admin/` for custom)
- **Pages** → `src/app/` (App Router structure)
- **One responsibility per file** - keep files focused and modular

## Adding Features

### 1. Add a Database Model

Edit `prisma/schema.prisma`:
```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())

  @@index([authorId])
}
```

Then update the database:
```bash
npm run db:push
npm run db:generate
```

### 2. Create a tRPC Router

Create `src/server/api/routers/posts.ts`:
```typescript
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    })
  }),

  create: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.post.create({
        data: {
          ...input,
          authorId: 'user-id', // Get from auth session
        },
      })
    }),
})
```

Add to `src/server/api/root.ts`:
```typescript
import { postsRouter } from './routers/posts'

export const appRouter = createTRPCRouter({
  settings: settingsRouter,
  users: usersRouter,
  posts: postsRouter, // Add this
})
```

### 3. Use in Components

```typescript
'use client'

import { api } from '@/lib/trpc/react'

export function PostsList() {
  const { data: posts, isLoading } = api.posts.getAll.useQuery()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  )
}
```

## Adding shadcn/ui Components

```bash
# Add a component (e.g., button, card, dialog)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog

# Components are added to src/components/ui/
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (for migrations)
- `NEXTAUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)

Optional:
- `UPSTASH_REDIS_REST_URL` - Redis for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `RESEND_API_KEY` - Email service (Resend)
- `SENTRY_DSN` - Error tracking (Sentry)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Vercel automatically:
- Installs dependencies
- Runs `prisma generate` (via `postinstall`)
- Pushes database schema (via `buildCommand` in `vercel.json`)
- Builds Next.js

### Other Platforms

Requirements:
- Node.js 18+
- PostgreSQL database

Build command:
```bash
prisma db push --accept-data-loss && prisma generate && next build
```

Start command:
```bash
next start
```

## Tech Stack Details

- **Next.js 16** - App Router, React Server Components, Turbopack
- **TypeScript** - Type-safe development
- **tRPC** - End-to-end type-safe API
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Production database
- **NextAuth.js** - Authentication
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first styling
- **Zod** - Schema validation

## Admin Dashboard

Access at `/admin`:

- **Dashboard** (`/admin/dashboard`) - User stats, recent signups
- **Users** (`/admin/users`) - User management with filtering & role updates
- **Settings** (`/admin/settings`) - App configuration (site name, theme, timezone)

Default layout includes:
- Sidebar navigation
- Mobile-responsive
- Dark mode support (system/light/dark)

## Common Tasks

### Add Authentication Protection

Use the `protectedProcedure` in tRPC:
```typescript
import { protectedProcedure } from '@/server/api/trpc'

export const postsRouter = createTRPCRouter({
  create: protectedProcedure // Only authenticated users
    .input(...)
    .mutation(async ({ ctx, input }) => {
      // ctx.session.user is available
      const userId = ctx.session.user.id
      // ...
    }),
})
```

### Add a Page

Create `src/app/about/page.tsx`:
```typescript
export default function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <p>This is a minimal Next.js template.</p>
    </div>
  )
}
```

### Add an API Route

Create `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
```

## Troubleshooting

**Type errors after adding models?**
```bash
npm run db:generate
npm run typecheck
```

**Database out of sync?**
```bash
npm run db:push
```

**Build fails?**
```bash
npm run typecheck  # Check for type errors first
npm run lint       # Check for lint errors
npm run build      # Try build again
```

## Next Steps

1. **Add your features** - Create models, routers, and pages
2. **Customize UI** - Update colors in `tailwind.config.ts`
3. **Add authentication** - Configure NextAuth providers
4. **Set up email** - Add Resend for transactional emails
5. **Deploy** - Push to Vercel or your platform of choice

## Support

- Repository: https://github.com/willem4130/nextjs-fullstack-template
- Issues: https://github.com/willem4130/nextjs-fullstack-template/issues
- Author: Willem van den Berg <willem@scex.nl>
