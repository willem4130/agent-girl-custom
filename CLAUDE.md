# Next.js Fullstack Template

Minimal, production-ready Next.js template with tRPC, Prisma, and shadcn/ui. Built for rapid fullstack development.

**Stack**: Next.js 16 + tRPC + Prisma + PostgreSQL + shadcn/ui + TypeScript

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Update DATABASE_URL in .env, then push schema
bun run db:push

# Seed the database
bunx prisma db seed

# Start development server
bun run dev
```

Visit `http://localhost:3000` to see your app!

## Session Continuity

**At the start of each new session**, check if `.claude/last-session.md` exists. If it does:
1. Read the file to understand the previous session's context
2. Acknowledge what was previously done
3. Continue from the documented next steps

Use `/close` at the end of a session to save state for next time.

## Automation Preferences

**Claude should automate CLI commands whenever possible.**

### Tool Preferences

1. **Package Manager**: Always use `bun` (it's installed and faster than npm)
   - `bun install` instead of `npm install`
   - `bun add <package>` instead of `npm install <package>`
   - `bun run <script>` instead of `npm run <script>`
   - `bun remove <package>` instead of `npm uninstall <package>`

2. **Git Operations**: Run automatically
   - `git add <files>` - stage specific changed files
   - `git commit -m "message"` - commit with descriptive message
   - `git push` - push to remote
   - `git branch <name>` - create branches
   - `git checkout <branch>` - switch branches
   - `git status` - check status before commits

3. **Database**: Run automatically
   - `bun run db:push` - push schema changes
   - `bun run db:generate` - regenerate Prisma client
   - `bun run db:migrate` - create migrations
   - `bun run db:studio` - open Prisma Studio

4. **Code Quality**: Run automatically after edits
   - `bun run typecheck` - ALWAYS run after editing TypeScript
   - `bun run lint` - run to catch errors
   - `bun run format` - format code
   - These catch bugs early and ensure consistency

5. **Build/Test**: Run automatically
   - `bun run dev` - start dev server
   - `bun run build` - build for production
   - `bun run test` - run tests
   - `bun run test:e2e` - run E2E tests

### When to Ask User

Only ask for manual intervention when:
- **Sensitive data required**: API keys, passwords, tokens, secrets
- **External setup needed**: GitHub repo creation, Vercel deployment, database hosting
- **Destructive actions**: `git push --force`, `prisma db push --force-reset`, deleting production data
- **Architecture decisions**: Which library/framework to use, major design choices
- **Unclear requirements**: Feature specs that need clarification

### Default Behavior

- **After editing files**: Run `bun run typecheck` automatically
- **After schema changes**: Run `bun run db:push && bun run db:generate` automatically
- **After adding dependencies**: Run `bun install` automatically
- **Before suggesting manual steps**: Check if it can be automated with CLI tools

### Examples

**GOOD (Automated)**:
```
I'll add the new component and run typecheck.
[Edits file]
[Runs: bun run typecheck]
```

**BAD (Manual)**:
```
I've added the component. Please run:
npm run typecheck
```

**GOOD (Asking when needed)**:
```
I need your Resend API key to configure email. Please provide it.
```

**BAD (Asking unnecessarily)**:
```
Should I run git commit for you?
[Just do it automatically!]
```

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
bun run typecheck

# 2. Lint (optional but recommended)
bun run lint

# 3. Format check (optional)
bun run format:check
```

If you make schema changes:
```bash
bun run db:push          # Push to database
bun run db:generate      # Regenerate Prisma client
bun run typecheck        # Verify no type errors
```

## Key Commands

```bash
# Development
bun run dev                        # Start dev server (Turbopack)
bun run build                      # Build for production
bun run start                      # Start production server

# Database
bun run db:push                    # Push schema changes
bun run db:generate                # Regenerate Prisma client
bun run db:migrate                 # Create migration
bun run db:studio                  # Open Prisma Studio

# Code Quality
bun run typecheck                  # Type check (no errors = safe to commit)
bun run lint                       # Run ESLint
bun run format                     # Format with Prettier
bun run format:check               # Check formatting

# Testing
bun run test                       # Run Vitest tests
bun run test:ui                    # Vitest UI
bun run test:e2e                   # Playwright E2E tests
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
bun run db:push
bun run db:generate
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
bun run db:generate
bun run typecheck
```

**Database out of sync?**
```bash
bun run db:push
```

**Build fails?**
```bash
bun run typecheck  # Check for type errors first
bun run lint       # Check for lint errors
bun run build      # Try build again
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
