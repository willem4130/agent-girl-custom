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
3. User selects template → `CopywritingContext.templateId`
4. User selects tone preset → `CopywritingContext.tonePresetId`
5. Context passed via WebSocket → `systemPrompt.ts` injects into prompt

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
