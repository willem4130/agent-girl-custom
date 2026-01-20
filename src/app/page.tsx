import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, CheckCircle2, Code2, Database, Zap, Shield } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <h1 className="text-xl font-semibold">Next.js Fullstack Template</h1>
          </div>
          <Link href="/admin/dashboard">
            <Button>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Build Your Next Project Faster
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            A minimal, production-ready Next.js template with tRPC, Prisma, and shadcn/ui.
            Everything you need to build modern fullstack applications.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/admin/dashboard">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://github.com/willem4130/nextjs-fullstack-template"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50">
        <div className="container px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h3 className="text-center text-3xl font-bold">What's Included</h3>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Code2 className="h-8 w-8 text-blue-600" />
                  <CardTitle className="mt-4">End-to-End Type Safety</CardTitle>
                  <CardDescription>
                    Full type safety from database to frontend with tRPC and Prisma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      tRPC for type-safe APIs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Prisma for type-safe database access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Zod for runtime validation
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Database className="h-8 w-8 text-purple-600" />
                  <CardTitle className="mt-4">Database & Auth Ready</CardTitle>
                  <CardDescription>
                    Pre-configured PostgreSQL with NextAuth.js authentication
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      PostgreSQL with Prisma ORM
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      NextAuth.js integration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      User roles & permissions
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-green-600" />
                  <CardTitle className="mt-4">Beautiful UI Components</CardTitle>
                  <CardDescription>
                    shadcn/ui components with dark mode and accessibility built-in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      shadcn/ui component library
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Tailwind CSS for styling
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Dark mode with next-themes
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-orange-600" />
                  <CardTitle className="mt-4">Production Ready</CardTitle>
                  <CardDescription>
                    Testing, linting, and deployment configuration included
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Vitest & Playwright testing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ESLint & Prettier configured
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Vercel deployment ready
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="border-t">
        <div className="container px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-3xl font-bold">Modern Tech Stack</h3>
            <p className="mt-4 text-lg text-muted-foreground">
              Built with the latest and most reliable technologies
            </p>
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold">Next.js 16</p>
                <p className="text-sm text-muted-foreground">App Router</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold">TypeScript</p>
                <p className="text-sm text-muted-foreground">Type Safety</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold">tRPC</p>
                <p className="text-sm text-muted-foreground">Type-safe API</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold">Prisma</p>
                <p className="text-sm text-muted-foreground">ORM</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold">PostgreSQL</p>
                <p className="text-sm text-muted-foreground">Database</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold">shadcn/ui</p>
                <p className="text-sm text-muted-foreground">Components</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold">Tailwind CSS</p>
                <p className="text-sm text-muted-foreground">Styling</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold">NextAuth.js</p>
                <p className="text-sm text-muted-foreground">Auth</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t">
        <div className="container px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-3xl font-bold">Ready to get started?</h3>
            <p className="mt-4 text-lg text-muted-foreground">
              Check out the admin dashboard to see the template in action
            </p>
            <div className="mt-8">
              <Link href="/admin/dashboard">
                <Button size="lg">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>Next.js Fullstack Template</p>
          <p>Built with Next.js, tRPC & Prisma</p>
        </div>
      </footer>
    </main>
  )
}
