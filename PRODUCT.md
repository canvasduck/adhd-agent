# ADHD App - Product Definition

## Overview

A mobile-first task management app designed specifically for users with ADHD. Uses AI to transform overwhelming environments into manageable atomic tasks, with coaching support and dopamine-driven feedback loops.

---

## Core Principles

### ADHD-Specific Design Considerations

| Challenge | Design Response |
|-----------|-----------------|
| Task initiation difficulty | Show only 1-3 low-effort tasks; reduce decision paralysis |
| Working memory | Persistent context; coach remembers conversation |
| Time blindness | Time estimates on tasks (future); no punitive "overdue" states |
| Overwhelm sensitivity | Atomic tasks only; collapsible projects; calm UI |
| Dopamine seeking | Rich feedback on every action; celebrations; streaks |

### Guiding Principles

1. **Less is more** - Never show more than the user can handle
2. **Atomic tasks** - Smallest reasonable unit ("take cups to kitchen" not "clean kitchen")
3. **LLM-generated, user-edited** - AI does the breakdown work; user retains control
4. **Celebrate everything** - Dopamine feedback on all progress
5. **Friend, not taskmaster** - Coach tone is supportive, never judgmental

---

## Information Architecture

```
App
├── Home (default view)
│   └── 1-3 atomic tasks from across all projects
├── Todos (left tab)
│   └── Projects (collapsible)
│       └── Tasks (atomic units)
├── Coach (middle tab)
│   └── Chat interface with contextual chips
└── Camera (right tab)
    └── Photo capture → task extraction flow
```

---

## Screens & Components

### Bottom Navigation Bar

Fixed bottom nav with 3 equally-sized touch targets:

| Position | Icon | Label | Action |
|----------|------|-------|--------|
| Left | List/checkbox icon | Todos | Navigate to todo management |
| Center | Chat bubble or avatar | Coach | Open coach panel (bottom sheet, 80% height) |
| Right | Camera icon | Capture | Open camera/image upload |

The center button should be visually distinct (larger, accent color, or elevated).

---

### Home Screen

**Purpose:** Reduce overwhelm by showing only immediate, low-effort tasks.

**Layout:**
```
┌─────────────────────────────────┐
│  [Greeting based on time]       │
│  "Good morning, ready to win?"  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ ○ Take cups to kitchen  │    │
│  │   ~ Kitchen cleanup     │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ○ Reply to Sarah's text │    │
│  │   ~ Personal            │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ○ Put laptop in bag     │    │
│  │   ~ Morning routine     │    │
│  └─────────────────────────┘    │
│                                 │
│         [empty space]           │
│                                 │
├─────────────────────────────────┤
│  [Todos]    [Coach]   [Camera]  │
└─────────────────────────────────┘
```

**Task Cards:**
- Checkbox (large tap target, left side)
- Task title (atomic action)
- Project name (subtle, below title)
- Tapping card → navigates to Todos page (scrolled to that project)
- Tapping checkbox → completes task with dopamine feedback

**Completion Interaction:**
1. Checkbox animates (scale up, color fill)
2. Satisfying sound effect (subtle, optional)
3. Card shrinks/fades out
4. Micro-copy appears briefly ("Nice!" / "Crushed it!" / "One down!")
5. Next task slides up to fill space (if available)

**Empty State (no tasks):**
```
┌─────────────────────────────────┐
│                                 │
│         [celebration icon]      │
│                                 │
│    "You're all caught up!"      │
│                                 │
│    Nothing on your plate.       │
│    Enjoy the moment, or...      │
│                                 │
│    [Take a photo of a space]    │
│    [Chat with your coach]       │
│                                 │
└─────────────────────────────────┘
```

**Task Selection Algorithm:**
- Pull from incomplete tasks across all projects
- Prioritize by: atomic size (smallest first), then recency (newest first)
- Maximum 3 tasks displayed
- If fewer than 3 incomplete tasks exist, show fewer

---

### Todos Page (Left Tab)

**Purpose:** Full task management with project organization.

**Layout:**
```
┌─────────────────────────────────┐
│  Todos                    [+]   │
├─────────────────────────────────┤
│                                 │
│  ▼ Kitchen cleanup         2/5  │
│  ┌─────────────────────────┐    │
│  │ ☑ Take cups to kitchen  │    │
│  │ ☑ Load dishwasher       │    │
│  │ ○ Wipe counters         │    │
│  │ ○ Take out trash        │    │
│  │ ○ Sweep floor           │    │
│  └─────────────────────────┘    │
│                                 │
│  ▶ Morning routine         0/4  │
│                                 │
│  ▶ Work tasks              1/3  │
│                                 │
│  [+ Add project]                │
│                                 │
├─────────────────────────────────┤
│  [Todos]    [Coach]   [Camera]  │
└─────────────────────────────────┘
```

**Project Row:**
- Collapse/expand chevron (left)
- Project name
- Progress indicator (completed/total)
- Tap row to expand/collapse
- Long press or swipe for edit/delete options

**Task Row (within expanded project):**
- Checkbox (left)
- Task title
- Swipe left to delete
- Tap to edit (inline or modal)
- Completed tasks: strikethrough, muted color, sorted to bottom

**Add Actions:**
- [+] button in header: Add new project
- [+ Add task] appears at bottom of each expanded project
- Both open simple text input (inline or modal)

**Empty State (no projects):**
```
┌─────────────────────────────────┐
│                                 │
│      [friendly illustration]    │
│                                 │
│   "Nothing here yet!"           │
│                                 │
│   Take a photo of a messy       │
│   spot and I'll help you        │
│   break it down.                │
│                                 │
│   [Open camera]                 │
│                                 │
└─────────────────────────────────┘
```

---

### Coach Panel (Middle Tab)

**Purpose:** AI-powered support for task breakdown, motivation, and problem-solving.

**Behavior:** Opens as bottom sheet (80% viewport height), similar to ncc-frontend AgentPanel implementation.

**Layout:**
```
┌─────────────────────────────────┐
│  ─────  (drag handle)           │
│  Your Coach              [X]    │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ Hey! What's on your     │    │
│  │ mind?                   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────────┐│
│  │ I'm struggling to start     ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ This feels overwhelming     ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ Help me break this down     ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ I finished something!       ││
│  └─────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│  [Type a message...]     [Send] │
└─────────────────────────────────┘
```

**Chips (Pre-populated Prompts):**
Contextual chips help users who struggle to articulate their needs:
- "I'm struggling to start"
- "This feels overwhelming"
- "Help me break this down"
- "I finished something!" (celebration path)
- "I keep getting distracted"
- "What should I do next?"

Chips update based on context (future enhancement).

**Chat Behavior:**
- Streaming responses (character by character)
- Coach uses friend/supportive tone
- Can reference user's projects/tasks when asked
- For now: advises only (doesn't create/modify tasks directly)
- Future: "Would you like me to add these tasks?" → user confirms

**Coach Personality:**
- Warm, encouraging, never judgmental
- Celebrates small wins enthusiastically
- Offers concrete, actionable suggestions
- Acknowledges ADHD challenges without pathologizing
- Uses casual language ("Let's do this" not "You should")

---

### Camera/Capture Flow (Right Tab)

**Purpose:** Transform photos of messy spaces into actionable task lists.

**Step 1: Capture**
```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │    [Camera viewfinder]  │    │
│  │                         │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Point at a messy spot and      │
│  I'll help you tackle it.       │
│                                 │
│         [  Capture  ]           │
│                                 │
│  [Choose from gallery]          │
│                                 │
└─────────────────────────────────┘
```

**Step 2: Processing**
```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────┐    │
│  │   [Captured image]      │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Looking at your space...│    │
│  │                         │    │
│  │ [typing indicator]      │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Step 2b: Clarifying Question (if needed)**
```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────┐    │
│  │   [Captured image]      │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Quick question:         │    │
│  │                         │    │
│  │ Is this your personal   │    │
│  │ desk or a shared space? │    │
│  └─────────────────────────┘    │
│                                 │
│  [My desk]  [Shared]  [Other]   │
│                                 │
└─────────────────────────────────┘
```

**Step 3: Review & Edit Tasks**
```
┌─────────────────────────────────┐
│  ←  Review tasks                │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │   [Captured image]      │    │
│  └─────────────────────────┘    │
│                                 │
│  Project: Desk cleanup          │
│  ──────────────────────────     │
│                                 │
│  ☑ Throw away empty wrappers    │
│  ☑ Put pens in cup              │
│  ☑ Stack loose papers           │
│  ☑ Take dishes to kitchen       │
│  ☑ Wipe down surface            │
│                                 │
│  [+ Add another task]           │
│                                 │
│  ┌─────────────────────────┐    │
│  │   [Save to my todos]    │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Editing Capabilities:**
- Tap task to edit text inline
- Swipe to delete task
- Checkboxes pre-checked (included by default)
- Uncheck to exclude from saved list
- Tap project name to rename
- Add additional tasks manually

**After Save:**
- Navigate to Todos page
- New project expanded and highlighted briefly
- Success toast: "Added 5 tasks to Desk cleanup"

---

## Onboarding Flow

**Goal:** Get user to first "win" as fast as possible.

**Screen 1: Welcome**
```
┌─────────────────────────────────┐
│                                 │
│      [friendly illustration]    │
│                                 │
│   Hey! I'm here to help you     │
│   get things done without       │
│   the overwhelm.                │
│                                 │
│   Let's start with something    │
│   easy.                         │
│                                 │
│       [Let's go]                │
│                                 │
└─────────────────────────────────┘
```

**Screen 2: Photo Prompt**
```
┌─────────────────────────────────┐
│                                 │
│      [camera illustration]      │
│                                 │
│   Take a photo of one spot      │
│   that's been bugging you.      │
│                                 │
│   A messy desk, cluttered       │
│   counter, overflowing          │
│   laundry... anything.          │
│                                 │
│   I'll help you break it down   │
│   into tiny, doable steps.      │
│                                 │
│       [Open camera]             │
│                                 │
│   [Skip for now]                │
│                                 │
└─────────────────────────────────┘
```

**After Photo Flow:** User completes the capture flow (review tasks, save).

**Screen 3: First Win Setup**
```
┌─────────────────────────────────┐
│                                 │
│         [task icon]             │
│                                 │
│   Perfect! You've got 5 tiny    │
│   tasks ready.                  │
│                                 │
│   I'll show you just 1-3 at a   │
│   time so you don't get         │
│   overwhelmed.                  │
│                                 │
│   Ready to knock one out?       │
│                                 │
│       [Show me]                 │
│                                 │
└─────────────────────────────────┘
```

→ Navigate to Home with tasks visible.

**If User Skips Photo:**
→ Navigate to Home with empty state (encourages photo or coach).

---

## Dopamine Feedback System

### Task Completion

| Element | Implementation |
|---------|----------------|
| Checkbox animation | Scale 1.0 → 1.2 → 1.0, fill color |
| Sound | Short, satisfying "pop" or "ding" (optional, respects system settings) |
| Micro-copy | Random from pool: "Nice!", "Crushed it!", "One down!", "Easy!", "You did it!" |
| Card animation | Shrinks and fades, next task slides up |

### Project Completion (all tasks done)

| Element | Implementation |
|---------|----------------|
| Animation | Confetti burst or sparkle effect |
| Sound | Celebratory chime |
| Message | "You finished [Project name]! Take a moment to feel good about that." |
| Visual | Project row gets subtle glow or checkmark badge |

### Streaks (Future Enhancement)

- Daily check-in streak
- Tasks completed today counter
- "You've completed tasks 5 days in a row!"

### Progress Indicators

- Project progress: "2/5" or progress bar
- Home screen could show daily progress (future)

---

## Auth & Data Strategy

### Non-Authenticated Users

| Feature | Behavior |
|---------|----------|
| Task storage | Local only (localStorage or IndexedDB) |
| LLM usage | Limited (e.g., 5 image analyses, 20 coach messages) |
| Prompt to sign up | After hitting limits, or periodically ("Save your progress?") |
| Data on sign up | Offer to migrate local data to account |

### Authenticated Users

| Feature | Behavior |
|---------|----------|
| Task storage | Supabase (synced) |
| LLM usage | Higher/no limits |
| Conversation history | Persisted |
| Multi-device | Synced |

### Auth UI

- Supabase Auth UI (or custom)
- Email/password + magic link
- OAuth (Google, Apple) for mobile convenience
- Appears when: hitting limits, tapping "Save progress", or via settings

---

## Platform & Technical Notes

### Mobile-First Responsive Web

- Target: 375px - 428px width (iPhone SE to iPhone Pro Max)
- Touch targets: minimum 44x44px
- Bottom nav: fixed, always visible
- Coach panel: bottom sheet pattern (familiar mobile UX)

### Future Native Wrapper

Build with wrapping in mind:
- Use Capacitor-compatible APIs
- Camera: use standard file input with capture, easy to swap for native
- No web-only features that won't translate
- Store data in a way that Capacitor can access

### Accessibility

- VoiceOver/TalkBack support
- Reduced motion option (disable confetti, minimize animations)
- High contrast support
- Sound effects respect device mute/settings

---

## Out of Scope (V1)

- Push notifications / reminders
- Calendar integration
- Recurring tasks
- Time estimates on tasks
- Due dates
- Sharing / collaboration
- Widget
- Offline mode (beyond localStorage)
- Dark mode (unless trivial to add)

---

## Open Questions

1. **Daily reset?** Do incomplete tasks persist forever, or is there a daily "fresh start" concept?
2. **Task archival?** What happens to completed tasks? Keep forever? Auto-archive after X days?
3. **Coach memory scope?** Does coach remember past conversations, or each session fresh?
4. **Gamification depth?** Points, levels, achievements beyond streaks?
5. **Branding/name?** Current working title is "ADHD App" - final name TBD.
