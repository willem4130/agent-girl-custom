# Agent Girl

Desktop-first chat interface for Claude Agent SDK with real-time streaming, persistent sessions, and integrated copywriting/media workflows.

## Tech Stack

Bun + React 19 + TypeScript + Tailwind CSS + Radix UI + SQLite + FAL.ai

## Quick Commands

```bash
# Dev server (port 3001)
bun run dev

# Type check (REQUIRED after edits)
bunx tsc --noEmit

# Lint
bunx eslint .

# Restart server
lsof -ti:3001 | xargs kill -9 2>/dev/null; bun run dev
```

## Code Quality - MANDATORY

After editing ANY file:
1. Run `bunx tsc --noEmit` - fix ALL errors
2. Run `bunx eslint .` - fix ALL warnings
3. Check server output for runtime errors

## Project Structure

```
server/                    # Backend (Bun + WebSocket)
├── routes/                # REST API (one file per resource)
├── copywriting/           # Brand voice, templates, copy formatting
├── media-generation/      # Image/video providers, prompt engine
├── commands/              # Slash commands by mode
└── systemPrompt.ts        # Mode-specific system prompts

client/                    # Frontend (React 19)
├── components/
│   ├── chat/              # Chat interface
│   ├── copywriting/       # Brand panel, copy library, templates
│   ├── media/             # Workflow editor, galleries
│   └── ui/                # Base components (Radix)
├── hooks/                 # API hooks, state management
└── lib/stores/            # Context providers
```

## Key Patterns

**API routes:** `/server/routes/` - one file per resource
**Components:** `/client/components/` - one component per file, <300 lines
**Hooks:** `/client/hooks/` - one hook per file, prefix with `use`
**Slash commands:** `/server/commands/[mode]/` - one .md file per command

## Design System

- **Colors:** Monochrome grays with white accents (`rgba(255,255,255,0.04-0.9)`)
- **Borders:** Subtle (`rgba(255,255,255,0.06-0.1)`), NO colored borders
- **Hierarchy:** Content first, metadata secondary, actions tertiary
- **Cards:** Prefer dividers over nested cards
- **Badges:** Plain text or subtle gray pills, avoid rainbow colors

## Markdown Rendering

Chat messages use ReactMarkdown with:
- `remark-gfm` for GitHub-flavored markdown
- `remark-breaks` for preserving line breaks
- Text preprocessing: single newlines → double newlines for proper paragraph spacing
- Custom prose CSS in `globals.css` for paragraph/subheader spacing

## Modes

- General, Coder, Spark, Intense-Research, Copywriting, Media

## Key APIs

```
# Copywriting
GET/POST /api/copywriting/brands
GET/POST /api/copywriting/copy
POST /api/copywriting/copy/save-from-chat
GET /api/copywriting/brands/:id/tone-presets
GET/POST /api/copywriting/brands/:id/formats
POST /api/copywriting/brands/:id/formats/init
PATCH /api/copywriting/formats/:id/toggle|default

# Scraping & Voice Analysis
POST /api/copywriting/brands/:id/analyze        # Quick scrape (website + social)
POST /api/copywriting/brands/:id/deep-analyze   # Deep crawl + LLM voice analysis
GET /api/copywriting/brands/:id/voice-profile   # Get tone scores
GET /api/copywriting/brands/:id/voice-analysis  # Get AI-generated voice description
GET /api/copywriting/brands/:id/scraped-content # Get raw scraped content

# Media
POST /api/media/images/generate
GET /api/media/images
POST /api/media/videos/generate

# Workflows
GET/POST/PUT/DELETE /api/workflows
```

## Copywriting Context Flow

1. User selects brand → `CopywritingContext.brandId`
2. User selects content formats → `CopywritingContext.contentFormatIds` (multi-select)
3. Context passed via WebSocket → `systemPrompt.ts` injects into prompt

**Note:** Template and Tone Preset selectors are hidden. The LLM asks for context via chat instead.

## Brand Context Injection (systemPrompt.ts)

When a brand is selected, the following **brand guidelines** are injected into the system prompt:

1. **Brand info**: name, website, social URLs
2. **Voice analysis**: voice description, writing guidelines, example hooks
3. **Vocabulary preferences**: preferred terms, terms to avoid
4. **Tone dimensions**: formality, authority, energy, humor scores (0-100)
5. **Website content**: full extracted content for terminology/messaging
6. **Top LinkedIn posts**: sorted by engagement - mimic this style

These define HOW to write (tone, style, vocabulary) and apply to ALL content for the brand.

## Two Types of Context in Copywriting Mode

The system provides TWO distinct types of context:

### 1. Brand Guidelines (HOW to write)
Injected into system prompt. Applies to ALL content for the brand.
- Voice & tone (formality, authority, energy, humor scores)
- Writing style and vocabulary preferences
- Example hooks from top-performing content
- Website content for terminology/messaging
- Top LinkedIn posts for structure/style reference

### 2. Reference Materials (WHAT to write about)
Saved to `.references/` folder. Topic-specific source material for each post.
- AI reads these with the Read tool
- Contains facts, details, subject matter for the specific content
- Uploaded via Session Reference Materials panel

### Reference Materials - File-Based Approach

When user uploads a reference file:
1. File content is saved to `{working_directory}/.references/{filename}`
2. System prompt tells AI to check `.references/` folder
3. AI uses Read tool to access the full content
4. No size limits - AI reads entire file

This replaces the old prompt-injection approach which had size limits and complexity.

### Key Files
- `server/routes/copywriting.ts:2017` - Saves files to `.references/` on upload
- `server/systemPrompt.ts` - Tells AI about `.references/` folder
- `client/components/copywriting/SessionReferenceMaterialsPanel.tsx` - Upload UI
- `server/copywriting/database.ts` - Stores reference metadata (for UI listing)

**Note:** `server/copywriting/reference-context.ts` only handles brand references now.
Session reference injection code was removed - AI reads files directly instead.

### API Endpoints
```
POST /api/sessions/:sessionId/references         # Add reference (saves to .references/)
GET /api/sessions/:sessionId/references          # List session refs
DELETE /api/sessions/:sessionId/references/:id   # Delete specific ref
```

## Copywriting Mode Behavior

The LLM in copywriting mode:
- **Reads reference materials first**: checks `.references/` folder for topic-specific content
- **Applies brand guidelines**: uses injected voice/tone for consistent brand voice
- **Shows copy directly in chat**: never saves to files unless explicitly asked
- **Mimics top performers**: uses structure/hooks from high-engagement posts as style guide

## Content Format Structure

Each brand has content formats with rich metadata for AI generation:

```typescript
{
  format_type: 'linkedin_post' | 'newsletter' | 'article' | ...
  custom_label: string           // Display name (e.g., "Nieuwsbrief")
  description: string            // Purpose & best practices for AI
  length_constraints: { min, max, optimal, unit: 'chars' | 'words' }
  format_rules: {
    preferEmojis: boolean
    avoidHashtags: boolean
    customInstructions: string[] // Platform-specific writing rules
  }
  tone_adjustments: {
    formality: 0-1   // 0.4 casual → 0.7 formal
    authority: 0-1   // 0.6 friendly → 0.9 expert
    warmth: 0-1      // 0.4 professional → 0.8 personal
  }
  structure_hints: {
    framework?: string           // e.g., "problem-agitate-solve"
    sections?: { name, prompt }[] // Section prompts for AI
  }
}
```

Formats are initialized via `POST /api/copywriting/brands/:id/formats/init` and injected into system prompts by `systemPrompt.ts`.

## Database

**Main (sessions.db):** sessions, messages, workflows

**Copywriting:** brands, brand_voice_profiles, brand_voice_analysis, post_type_templates, brand_tone_presets, brand_content_formats, generated_copy, copy_sections, generated_images

## Scraping Infrastructure

Voice profiles are built from scraped content. Located in `server/scraping/`.

### Website Crawler (`deep-crawler.ts`)
- Resolves canonical URLs (handles www → non-www redirects)
- Discovers URLs via sitemap.xml
- Respects robots.txt
- Default: 25 pages, max depth 5

**Priority paths** (crawled first):
- About: `/about`, `/over-ons`, `/over-*`, `/team`
- Services: `/services`, `/diensten`, `/wat-we-doen`, `/experts`
- Industry: `/wms`, `/supply-chain`, `/logistiek`, `/warehousing`, `/optimaliseren`
- Content: `/blog`, `/nieuws`, `/cases`, `/referenties`

**Content extraction**:
- `<p>` tags, article/main/section elements
- Divs with direct text content (no nested blocks)
- List items (ul/ol li)
- Minimum 30 chars per block

**Topic detection** (auto-tagged):
- logistics, wms, supplychain, optimization
- marketing, technology, ecommerce, consulting

### Social Media Scrapers
All use RapidAPI. Require `RAPIDAPI_KEY` in `.env`.

| Platform | API | Host | Subscribe |
|----------|-----|------|-----------|
| LinkedIn | Fresh LinkedIn Profile Data | `fresh-linkedin-profile-data.p.rapidapi.com` | [Link](https://rapidapi.com/freshdata-freshdata-default/api/fresh-linkedin-profile-data) |
| Instagram | Instagram Scraper API2 | `instagram-scraper-api2.p.rapidapi.com` | [Link](https://rapidapi.com/social-api1-instagram/api/instagram-scraper-api2) |
| Facebook | Facebook Scraper 3 | `facebook-scraper3.p.rapidapi.com` | [Link](https://rapidapi.com/developer_ajay/api/facebook-scraper3) |

### Scraping Flow
1. "Re-scrape" button → `POST /api/copywriting/brands/:id/analyze`
2. Scrapes all configured URLs (website, LinkedIn, Instagram, Facebook)
3. Stores in `scraped_content` and `scraped_pages` tables
4. "Re-analyze" button → `POST /api/copywriting/brands/:id/deep-analyze`
5. Sends content to Claude for voice analysis
6. Stores analysis in `brand_voice_profiles` and `brand_voice_analysis`

### LinkedIn Engagement Metrics
LinkedIn posts are scraped with engagement data (likes, comments, shares) and sorted by total engagement:
- **Engagement score**: `likes + (comments × 2) + (shares × 3)`
- **Top 10 posts** are marked as "top performers" and injected into the system prompt
- The LLM uses these as stylistic reference for consistent brand voice

### Key Files
- `server/scraping/deep-crawler.ts` - Website crawling with sitemap support
- `server/scraping/linkedin-scraper.ts` - LinkedIn company + posts
- `server/scraping/instagram-scraper.ts` - Instagram profile + posts
- `server/scraping/facebook-scraper.ts` - Facebook page + posts
- `server/scraping/rate-limiter.ts` - Per-platform rate limiting
- `server/scraping/circuit-breaker.ts` - Failure protection

### LinkedIn URL Format
Use company **username** URL, not numeric ID:
- ✅ `https://www.linkedin.com/company/scex`
- ❌ `https://www.linkedin.com/company/18216856`

The scraper also supports domain lookup (e.g., `scex.nl` → finds LinkedIn company).

## Testing Scraping

```bash
# Test LinkedIn scraper
bun -e "
import { scrapeLinkedInCompany } from './server/scraping/linkedin-scraper.ts';
const company = await scrapeLinkedInCompany('scex.nl');
console.log(company.name, '-', company.followers, 'followers');
"

# Test website crawler
bun -e "
import { deepCrawl, getCrawlSummary } from './server/scraping/deep-crawler.ts';
const pages = await deepCrawl('https://example.com', { maxPages: 5 });
console.log(getCrawlSummary(pages));
"

# Trigger full analysis via API
curl -X POST http://localhost:3001/api/copywriting/brands/{brandId}/deep-analyze \
  -H 'Content-Type: application/json' \
  -d '{"maxPages": 30, "runLlmAnalysis": true}'
```
