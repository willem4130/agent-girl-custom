# Agent Girl

Desktop-first chat interface for Claude Agent SDK with real-time streaming, persistent sessions, and specialized sub-agents running locally with full file system access.

## Tech Stack

Bun + React 19 + TypeScript + Tailwind CSS + Radix UI + SQLite

## Project Structure

```
agent-girl-custom/
├── server/                   # Backend (Bun + WebSocket, port 3001)
│   ├── server.ts             # Main entry point
│   ├── agents.ts             # Agent configuration
│   ├── systemPrompt.ts       # System prompts per mode
│   ├── routes/               # REST API endpoints
│   ├── websocket/            # Real-time messaging
│   ├── commands/             # Slash commands by mode
│   │   ├── copywriting/      # Copywriting mode commands
│   │   ├── coder/            # Coder mode commands
│   │   ├── general/          # General mode commands
│   │   └── shared/           # Cross-mode commands
│   ├── modes/                # System prompt templates (.txt)
│   ├── templates/            # CLAUDE.md templates per mode
│   ├── copywriting/          # Copywriting module & database
│   │   ├── database.ts       # Brand/voice database
│   │   └── strategies/       # Content-specific strategies
│   ├── knowledge/            # Knowledge bases per mode
│   ├── scraping/             # Web scraping infrastructure
│   │   ├── deep-crawler.ts   # Deep crawl & link extraction
│   │   └── content-analyzer.ts # Scraped content analysis
│   └── utils/                # Server utilities
├── client/                   # Frontend (React 19 + TypeScript)
│   ├── App.tsx               # Root component
│   ├── components/           # UI components
│   │   ├── chat/             # Chat interface
│   │   ├── copywriting/      # Brand management UI
│   │   ├── message/          # Message rendering
│   │   ├── sidebar/          # Navigation
│   │   ├── header/           # Header components
│   │   └── ui/               # Base components (Radix UI)
│   ├── hooks/                # Custom React hooks
│   │   ├── useSessionAPI.ts  # Session management
│   │   ├── useWebSocket.ts   # Real-time connection
│   │   ├── useBrandAPI.ts    # Brand API calls
│   │   └── useCopywritingSession.ts
│   └── utils/                # Client utilities
├── data/                     # SQLite session database
└── dist/                     # Build output
```

## Organization Rules

**Modularity principles:**
- API routes → `/server/routes`, one file per resource
- React components → `/client/components`, one component per file
- Slash commands → `/server/commands/[mode]`, one command per .md file
- Utilities → grouped by domain (server/utils, client/utils)
- Tests → co-located with code being tested

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
