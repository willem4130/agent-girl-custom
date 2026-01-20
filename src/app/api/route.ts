import { NextRequest } from 'next/server'
import { apiResponse } from '@/lib/api-middleware'

/**
 * GET /api - API Documentation
 * Public: No authentication required
 * Returns available API endpoints and usage information
 */
export async function GET(_request: NextRequest) {
  return apiResponse({
    name: 'Next.js Fullstack Template API',
    version: '1.0.0',
    description: 'Production-ready API with tRPC and REST endpoints',
    documentation: {
      endpoints: {
        health: {
          path: '/api/health',
          method: 'GET',
          description: 'Health check endpoint with database status',
          authentication: 'None',
        },
        trpc: {
          path: '/api/trpc',
          method: 'GET/POST',
          description: 'tRPC endpoint for type-safe API calls',
          authentication: 'Varies by procedure',
          documentation: 'See src/server/api/routers for available procedures',
        },
      },
      features: [
        'End-to-end type safety with tRPC',
        'REST API support with rate limiting',
        'Authentication with NextAuth.js',
        'Database access with Prisma',
        'Request validation with Zod',
      ],
      resources: {
        github: 'https://github.com/willem4130/nextjs-fullstack-template',
        documentation: 'https://github.com/willem4130/nextjs-fullstack-template#readme',
      },
    },
  })
}
