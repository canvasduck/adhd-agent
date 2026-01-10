# ADHD App Architecture

## Overview

A monolithic full-stack application that provides:
- **Image processing** - Extract tasks/lists from photos via vision LLM
- **Todo list management** - Persistent task storage with Supabase
- **AI coaching** - Contextual guidance and task breakdown assistance

## Core Architectural Decisions

### 1. Monolithic Backend + UI

```
┌─────────────────────────────────────────┐
│           Next.js Application           │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  UI (RSC)   │  │   API Routes    │   │
│  └─────────────┘  └────────┬────────┘   │
│                            │            │
│  ┌─────────────┐  ┌────────▼────────┐   │
│  │ LLM Service │◄─┤  Business Logic │   │
│  │             │  │                 │   │
│  └─────────────┘  └────────┬────────┘   │
└────────────────────────────┼────────────┘
                             │
                    ┌────────▼────────┐
                    │    Supabase     │
                    │  (PostgreSQL)   │
                    └─────────────────┘
```

**Rationale:** Single deployment minimizes latency and operational complexity. No CORS configuration, unified auth context, simpler debugging.

### 2. LLM Called from Backend, Not via MCP Tools

The backend orchestrates LLM calls and handles persistence directly, rather than giving the agent database tools.

**Rationale:**
- Backend validates/sanitizes LLM output before saving
- Simpler error handling and retries
- No need to trust LLM with direct database access
- Easier to audit and debug data flow
- Schema changes don't require prompt updates

```
User Request → API Route → LLM Service → Structured Response → Backend Saves → Supabase
```

### 3. Supabase for Persistence

Using Supabase PostgreSQL for:
- Todo items and lists
- User accounts (Supabase Auth)
- Conversation history (for coaching context)

**Rationale:** Managed PostgreSQL with built-in auth, real-time subscriptions if needed, and good Next.js integration.

### 4. Framework: Next.js (App Router)

**Chosen over alternatives because:**
- React familiarity (existing skillset from Athena project)
- First-class Supabase support
- Server Components reduce client-side JS
- Built-in streaming for LLM responses
- API routes colocated with UI
- Large ecosystem and documentation

**Trade-offs accepted:**
- Heavier than minimal alternatives (Hono, SvelteKit)
- Some Vercel-specific optimizations won't apply if self-hosting

## Project Structure

```
/adhd-app
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home/dashboard
│   ├── api/
│   │   ├── chat/route.ts       # Coaching chat endpoint (streaming)
│   │   ├── todos/route.ts      # CRUD for todos
│   │   └── process-image/route.ts  # Vision LLM endpoint
│   ├── todos/
│   │   └── page.tsx            # Todo list UI
│   └── coach/
│       └── page.tsx            # Coaching interface
├── lib/
│   ├── llm/
│   │   ├── client.ts           # OpenAI/OpenRouter client setup
│   │   ├── prompts.ts          # System prompts
│   │   └── services/
│   │       ├── image-processor.ts   # Vision/OCR extraction
│   │       ├── todo-generator.ts    # Task breakdown
│   │       └── coach.ts             # Coaching responses
│   ├── supabase/
│   │   ├── client.ts           # Supabase client
│   │   ├── server.ts           # Server-side client
│   │   └── types.ts            # Generated types
│   └── utils/
├── components/
│   ├── ui/                     # Reusable UI components
│   ├── todo-list.tsx
│   ├── image-upload.tsx
│   └── chat-panel.tsx
├── types/
│   └── index.ts
├── supabase/
│   └── migrations/             # Database migrations
├── .env.local
├── package.json
└── ARCHITECTURE.md
```

## LLM Service Pattern

Following the pattern from Kroger-agent, each LLM capability is a focused method:

```typescript
// lib/llm/services/image-processor.ts
class ImageProcessor {
  async extractTasks(base64Image: string, mimeType: string): Promise<Task[]> {
    // 1. Call vision model
    // 2. Parse structured response
    // 3. Return validated Task objects
  }
}

// lib/llm/services/todo-generator.ts
class TodoGenerator {
  async breakdownTask(task: string, context?: string): Promise<Subtask[]> {
    // Break complex task into actionable steps
  }
}

// lib/llm/services/coach.ts
class Coach {
  async respond(
    message: string,
    conversationHistory: Message[],
    userContext?: UserContext
  ): AsyncIterable<string> {
    // Streaming coaching response
  }
}
```

## Data Flow Examples

### Image to Todos
```
1. User uploads photo
2. POST /api/process-image with base64 image
3. ImageProcessor.extractTasks() calls vision LLM
4. LLM returns structured JSON: [{task, priority, estimatedMinutes}]
5. API route validates response
6. API route saves to Supabase todos table
7. Return created todos to client
```

### Coaching Session
```
1. User sends message in chat
2. POST /api/chat with message + conversationId
3. Load conversation history from Supabase
4. Coach.respond() streams from LLM
5. Stream chunks to client via ReadableStream
6. On completion, save assistant message to Supabase
```

## Database Schema (Initial)

```sql
-- Users handled by Supabase Auth

create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  priority int default 0,
  estimated_minutes int,
  parent_id uuid references todos(id) on delete cascade,  -- for subtasks
  source text,  -- 'manual', 'image', 'coach'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- RLS policies
alter table todos enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users can manage their own todos"
  on todos for all using (auth.uid() = user_id);

create policy "Users can manage their own conversations"
  on conversations for all using (auth.uid() = user_id);

create policy "Users can manage messages in their conversations"
  on messages for all using (
    conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  );
```

## Environment Variables

```bash
# .env.local
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Models
LLM_MODEL=anthropic/claude-sonnet-4  # or openai/gpt-4o
VISION_MODEL=anthropic/claude-sonnet-4
```

## Alternative Considered: SvelteKit

If React fatigue sets in or bundle size becomes a concern, SvelteKit would be the migration path:
- ~30-40% less code for equivalent functionality
- Faster builds and smaller bundles
- Similar file-based routing and API routes
- Form actions are more elegant than React Server Actions

The LLM service layer (`lib/llm/`) would remain unchanged - only UI components would need rewriting.
