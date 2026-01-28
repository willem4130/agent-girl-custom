# Agent Girl

Desktop-first chat interface for Claude Agent SDK with real-time streaming, persistent sessions, specialized sub-agents, and integrated copywriting/media generation workflows.

## Tech Stack

Bun + React 19 + TypeScript + Tailwind CSS + Radix UI + React Flow + SQLite + FAL.ai

## Project Structure

```
agent-girl-custom/
├── server/                       # Backend (Bun + WebSocket, port 3001)
│   ├── server.ts                 # Main entry point
│   ├── agents.ts                 # Agent configuration
│   ├── systemPrompt.ts           # System prompts per mode
│   ├── database.ts               # SQLite: sessions, messages, workflows
│   ├── routes/                   # REST API endpoints
│   │   ├── sessions.ts           # Session CRUD
│   │   ├── copywriting.ts        # Brand, copy, image generation
│   │   ├── media.ts              # Image/video generation
│   │   ├── workflows.ts          # Workflow CRUD
│   │   └── commands.ts           # Slash command execution
│   ├── websocket/                # Real-time messaging
│   ├── commands/                 # Slash commands by mode
│   │   ├── copywriting/          # Copywriting mode commands
│   │   ├── coder/                # Coder mode commands
│   │   ├── media/                # Media mode commands
│   │   ├── general/              # General mode commands
│   │   └── shared/               # Cross-mode commands
│   ├── copywriting/              # Copywriting module
│   │   ├── database.ts           # Brand/voice/copy database
│   │   ├── section-analyzer.ts   # LLM-based copy section analysis
│   │   └── strategies/           # Content strategies per platform
│   ├── media-generation/         # Media generation module
│   │   ├── providers/            # Image providers (Nano Banana, Seedream)
│   │   ├── video-providers/      # Video providers (Kling, Veo, WAN)
│   │   ├── prompt-engine/        # Prompt building, style presets
│   │   ├── video-editor/         # Video processing pipeline
│   │   └── utils/                # Storage, aspect ratios
│   ├── scraping/                 # Web scraping infrastructure
│   │   ├── deep-crawler.ts       # Deep crawl & link extraction
│   │   ├── content-analyzer.ts   # Content analysis
│   │   └── *-scraper.ts          # Platform-specific scrapers
│   ├── modes/                    # System prompt templates (.txt)
│   ├── knowledge/                # Knowledge bases per mode
│   └── utils/                    # Server utilities
├── client/                       # Frontend (React 19 + TypeScript)
│   ├── App.tsx                   # Root component
│   ├── components/
│   │   ├── chat/                 # Chat interface
│   │   ├── copywriting/          # Brand management, copy library
│   │   │   └── media/            # Copy-to-media generation
│   │   ├── media/                # Media mode
│   │   │   ├── workflow/         # React Flow node editor
│   │   │   │   └── nodes/        # 16 node types
│   │   │   ├── image/            # Image gallery components
│   │   │   ├── video/            # Video components
│   │   │   └── assets/           # Asset management
│   │   ├── message/              # Message rendering
│   │   ├── sidebar/              # Navigation
│   │   ├── header/               # Header components
│   │   └── ui/                   # Base components (Radix UI)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSessionAPI.ts      # Session management
│   │   ├── useWebSocket.ts       # Real-time connection
│   │   ├── useBrandAPI.ts        # Brand API calls
│   │   ├── useCopyLibrary.ts     # Copy library management
│   │   ├── useSectionAnalyzer.ts # LLM section analysis
│   │   ├── useWorkflow.ts        # Workflow state
│   │   ├── useWorkflowExecution.ts # Node execution
│   │   ├── useImages.ts          # Image gallery
│   │   ├── useVideos.ts          # Video gallery
│   │   └── useBatchImageGeneration.ts # Batch image gen
│   ├── lib/
│   │   ├── fal/                  # FAL.ai client configs
│   │   ├── video-editor/         # Client-side video pipeline
│   │   └── stores/               # Zustand stores
│   └── utils/                    # Client utilities
├── data/                         # SQLite databases
└── dist/                         # Build output
```

## Modes

- **General** - Versatile assistant
- **Coder** - Software engineering
- **Spark** - Rapid brainstorming
- **Intense-Research** - Research orchestration
- **Copywriting** - Marketing/sales copy with brand voice
- **Media** - Workflow-based image/video generation

## Database Schema

### Main Database (sessions.db)
- `sessions` - Chat sessions
- `messages` - Chat messages
- `workflows` - Media workflows (nodes/edges as JSON)

### Copywriting Database
- `brands` - Brand configurations
- `brand_voice_profiles` - Tone and language patterns
- `scraped_content` - Platform-specific content
- `generated_copy` - Copy variations with metadata
- `copy_sections` - Copy section breakdowns (headline, body, CTA)
- `generated_images` - Image generation records
- `section_images` - Links between sections and images
- `engagement_metrics` - Performance tracking

## Organization Rules

**Modularity principles:**
- API routes → `/server/routes`, one file per resource
- React components → `/client/components`, one component per file
- Slash commands → `/server/commands/[mode]`, one command per .md file
- Workflow nodes → `/client/components/media/workflow/nodes`
- Utilities → grouped by domain (server/utils, client/utils)

**Single responsibility:**
- Keep files focused and under 300 lines
- Extract shared logic to utilities
- Mode-specific features stay in mode folders

## Code Quality - Zero Tolerance

After editing ANY file, run ALL checks:

```bash
bunx tsc --noEmit
bunx eslint .
```

Fix ALL errors/warnings before continuing.

**Server restart (if needed):**
```bash
lsof -ti:3001 | xargs kill -9 2>/dev/null; bun run dev
```

Read server output and fix ALL warnings/errors.

## Key APIs

### Media Generation
- `POST /api/media/images/generate` - Generate images
- `GET /api/media/images` - List images
- `POST /api/media/videos/generate` - Generate videos
- `GET /api/media/videos` - List videos

### Copywriting
- `GET /api/copywriting/brands` - List brands
- `POST /api/copywriting/brands` - Create brand
- `GET /api/copywriting/copy` - List generated copy
- `POST /api/copywriting/copy/analyze-sections` - Analyze copy sections
- `POST /api/copywriting/images/batch` - Batch generate images for sections

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

## Key UI Components

### Copy Library (`CopyLibraryPanel`)
- Displays generated copy with smart titles (extracts headline or first line)
- Section breakdown with visual concept suggestions
- Batch image generation for multiple sections
- Links images to copy sections

### Image Gallery (`ImageCard`)
- Provider badges (Nano Banana, Seedream, etc.)
- Aspect ratio indicators (Square, Wide, Portrait)
- Favorite markers and status indicators
- Hover actions: edit, download, delete

### Media Workflow (`WorkflowCanvas`)
- React Flow-based node editor
- 16 node types for image/video generation
- Real-time execution status
- Save/load workflow presets
