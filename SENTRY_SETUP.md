# Sentry Error Tracking Setup

Production-ready error monitoring with Sentry for your Next.js application.

## ✅ What Was Implemented

### **1. Sentry SDK for Next.js** 🔍

- ✅ **@sentry/nextjs v10.24.0** installed
- ✅ **Client-side tracking** - Browser errors and React errors
- ✅ **Server-side tracking** - API errors and server-side crashes
- ✅ **Edge runtime support** - Middleware and Edge API routes
- ✅ **Session Replay** - See what users did before an error

### **2. Configuration Files** ⚙️

- ✅ `sentry.client.config.ts` - Client-side error tracking
- ✅ `sentry.server.config.ts` - Server-side error tracking
- ✅ `sentry.edge.config.ts` - Edge runtime error tracking
- ✅ `instrumentation.ts` - Next.js instrumentation hook
- ✅ `next.config.ts` - Sentry webpack plugin integration

### **3. Error Boundaries** 🛡️

- ✅ `error.tsx` - Page-level error boundary
- ✅ `global-error.tsx` - Application-level error boundary
- ✅ **Automatic error capture** in all pages
- ✅ **Manual error tracking** in API routes

### **4. Testing Tools** 🧪

- ✅ `/sentry-test` page with error simulation
- ✅ Test client errors, exceptions, and messages
- ✅ Verify Sentry integration

---

## 🚀 Setup Instructions

### **1. Create a Sentry Account**

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free (50k errors/month included)
3. Create a new project:
   - Platform: **Next.js**
   - Name: **your-project-name**

### **2. Get Your Sentry DSN**

After creating the project:

1. Copy your DSN (looks like: `https://abc123@o123456.ingest.sentry.io/7890123`)
2. Keep this for the next step

### **3. Configure Environment Variables**

Add to `.env.local` (create if it doesn't exist):

```bash
# Sentry DSN (required for error tracking)
NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"

# Sentry Organization & Project (required for source maps upload)
SENTRY_ORG="your-organization-slug"
SENTRY_PROJECT="your-project-name"

# Sentry Auth Token (required for source maps upload in production)
# Generate at: https://sentry.io/settings/account/api/auth-tokens/
# Required scopes: project:releases, org:read
SENTRY_AUTH_TOKEN="your-auth-token"
```

**How to find these values:**

- **SENTRY_ORG**: Your organization slug (in URL: `sentry.io/organizations/{org-slug}`)
- **SENTRY_PROJECT**: Your project slug (in URL: `sentry.io/organizations/{org}/projects/{project}`)
- **SENTRY_AUTH_TOKEN**: [Generate here](https://sentry.io/settings/account/api/auth-tokens/)
  - Select scopes: `project:releases`, `org:read`

### **4. Update .env.example** (Optional)

The `.env.example` file has already been updated with Sentry configuration examples.

---

## 📊 What Gets Tracked

### **Automatic Error Tracking**

**Client-Side:**

- ✅ Unhandled JavaScript errors
- ✅ Unhandled promise rejections
- ✅ React component errors (via error boundaries)
- ✅ Network request failures
- ✅ Console errors

**Server-Side:**

- ✅ Unhandled Node.js exceptions
- ✅ API route errors
- ✅ Server component errors
- ✅ Database errors
- ✅ Build-time errors

**Additional Data:**

- ✅ User browser & device info
- ✅ URL where error occurred
- ✅ Stack trace with source maps
- ✅ Breadcrumbs (user actions before error)
- ✅ Request context (headers, body)
- ✅ Environment (dev, staging, production)

### **Session Replay** (Optional)

When an error occurs:

- ✅ Video-like replay of user's session
- ✅ See what the user saw
- ✅ Mouse movements and clicks
- ✅ Console logs
- ✅ Network requests

**Privacy:** All text and media are masked by default.

---

## 🔧 Manual Error Tracking

### **In Client Components**

```typescript
'use client'

import * as Sentry from '@sentry/nextjs'

export function MyComponent() {
  const handleClick = () => {
    try {
      // Your code that might fail
      riskyOperation()
    } catch (error) {
      // Manually capture the error
      Sentry.captureException(error, {
        tags: {
          section: 'payment',
        },
        level: 'error',
      })

      // Show user-friendly message
      alert('Something went wrong. We've been notified.')
    }
  }

  return <button onClick={handleClick}>Click Me</button>
}
```

### **In Server Components & API Routes**

```typescript
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
  try {
    const data = await fetchData()
    return Response.json(data)
  } catch (error) {
    // Capture error with context
    Sentry.captureException(error, {
      contexts: {
        request: {
          method: request.method,
          url: request.url,
        },
      },
    })

    return Response.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
```

### **Capture Custom Messages**

```typescript
import * as Sentry from '@sentry/nextjs'

// Info message
Sentry.captureMessage('User completed onboarding', 'info')

// Warning
Sentry.captureMessage('API quota is running low', 'warning')

// Error with context
Sentry.captureMessage('Payment processing slow', {
  level: 'error',
  tags: {
    payment_provider: 'stripe',
  },
})
```

### **Add User Context**

```typescript
import * as Sentry from '@sentry/nextjs'

// Set user info (links errors to user)
Sentry.setUser({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe',
})

// Clear user info (on logout)
Sentry.setUser(null)
```

### **Add Custom Tags**

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.setTag('page', 'checkout')
Sentry.setTag('experiment', 'new-ui-v2')
```

---

## 🧪 Testing Sentry Integration

### **1. Test Page**

Visit: `http://localhost:3000/sentry-test`

This page includes:

- ✅ **Throw Client Error** - Tests error boundary
- ✅ **Capture Exception** - Tests manual error tracking
- ✅ **Send Message** - Tests message tracking

### **2. Test in Development**

```bash
npm run dev
```

1. Visit http://localhost:3000/sentry-test
2. Click "Throw Client Error"
3. Check your Sentry dashboard (may take 1-2 minutes)

### **3. Test API Error Tracking**

API routes automatically capture errors:

```bash
# This will trigger an error that gets sent to Sentry
curl http://localhost:3000/api/posts/invalid-id
```

### **4. Check Sentry Dashboard**

1. Go to [sentry.io](https://sentry.io)
2. Select your project
3. View **Issues** tab
4. See captured errors with full stack traces

---

## 📈 Sentry Features

### **Error Grouping**

Sentry automatically groups similar errors together:

- Same error type
- Same location in code
- Same stack trace

### **Alerts**

Set up alerts in Sentry dashboard:

- Email when new errors occur
- Slack notifications
- PagerDuty integration
- Custom webhooks

### **Performance Monitoring** (Optional)

Enable in `sentry.client.config.ts`:

```typescript
tracesSampleRate: 1.0, // Capture 100% of transactions
```

Tracks:

- ✅ Page load times
- ✅ API response times
- ✅ Database query performance
- ✅ External API calls

### **Release Tracking**

Automatically tracks releases using git commit SHA:

```bash
# In production build
npm run build
```

Sentry will:

- Associate errors with specific releases
- Track error introduction (which release broke it)
- Show before/after metrics

---

## ⚙️ Configuration Options

### **Sample Rates**

In `sentry.client.config.ts`:

```typescript
// Error sampling (100% = all errors)
tracesSampleRate: 1.0,

// Session replay on errors (100% = all errors get replay)
replaysOnErrorSampleRate: 1.0,

// Session replay for all sessions (10% = 1 in 10 sessions)
replaysSessionSampleRate: 0.1,
```

**Recommendations:**

- **Development**: 100% of everything
- **Production**:
  - Errors: 100% (don't miss any errors)
  - Replays on errors: 100%
  - Regular session replays: 10-20% (to save quota)

### **Ignored Errors**

Already configured in `sentry.client.config.ts`:

```typescript
ignoreErrors: [
  'chrome-extension', // Browser extensions
  'safari-extension', // Safari extensions
  'fb_xd_fragment', // Facebook SDK
  // Add your own patterns
]
```

### **Environment**

Automatically set based on `NODE_ENV`:

```typescript
environment: process.env.NODE_ENV,  // 'development', 'production', etc.
```

Filter errors by environment in Sentry dashboard.

---

## 🔒 Privacy & Security

### **What Sentry Collects**

- ✅ Error messages and stack traces
- ✅ Request URLs (sanitized)
- ✅ User browser/device info
- ✅ Console logs (breadcrumbs)
- ❌ Passwords or sensitive form data (automatically scrubbed)
- ❌ Full request bodies (unless you explicitly add them)

### **Data Scrubbing**

Sentry automatically removes:

- Password fields
- Credit card numbers
- API keys in URLs
- Auth tokens

### **Session Replay Privacy**

Configured in `sentry.client.config.ts`:

```typescript
maskAllText: true,     // Mask all text content
blockAllMedia: true,   // Block images and videos
```

---

## 📊 Free Tier Limits

### **Sentry Free Plan**

- ✅ **50,000 errors/month**
- ✅ **Unlimited projects**
- ✅ **30 days data retention**
- ✅ **Session Replay** (5,000 replays/month)
- ✅ **Performance Monitoring** (10,000 transactions/month)

Upgrade if you exceed limits or need:

- More data retention
- Priority support
- Advanced features

---

## 🐛 Troubleshooting

### **Errors Not Showing in Sentry?**

**1. Check DSN is configured:**

```bash
echo $NEXT_PUBLIC_SENTRY_DSN
```

**2. Check Sentry is initialized:**
Look for this in browser console:

```
Sentry Logger [Log]: Integration installed: InboundFilters
```

**3. Verify environment:**
Sentry is enabled in all environments by default. Check:

```typescript
// In browser console
console.log(process.env.NEXT_PUBLIC_SENTRY_DSN)
```

**4. Check Sentry dashboard:**

- Go to Settings → Projects → Your Project
- Click on "Client Keys (DSN)"
- Verify DSN matches your .env file

### **Source Maps Not Working?**

**1. Check auth token:**

```bash
echo $SENTRY_AUTH_TOKEN
```

**2. Verify token scopes:**
Required scopes: `project:releases`, `org:read`

**3. Check build logs:**
Look for "Source maps uploaded to Sentry" message

### **High Error Volume?**

**1. Adjust sample rates:**

```typescript
tracesSampleRate: 0.1,  // Only 10% of requests
```

**2. Filter noisy errors:**

```typescript
ignoreErrors: ['ResizeObserver', 'Non-Error exception captured']
```

---

## 📚 Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Dashboard**: https://sentry.io
- **Error Monitoring Guide**: https://docs.sentry.io/product/issues/
- **Session Replay**: https://docs.sentry.io/product/session-replay/
- **Performance**: https://docs.sentry.io/product/performance/

---

## ✅ Summary

You now have **production-ready error tracking** with:

- ✅ Automatic error capture (client & server)
- ✅ Session replay for debugging
- ✅ Error boundaries for graceful failures
- ✅ Source maps for readable stack traces
- ✅ Test page for verification
- ✅ Privacy-focused configuration
- ✅ API error tracking

Just add your Sentry DSN and you're ready to catch and fix bugs in production! 🚀
