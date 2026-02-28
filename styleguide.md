# Cortex — Design System & Style Guide

Adapted from the AgentSystem (Overmind) dashboard. Same tokens, same components, same visual language.

---

## Visual Identity

**Light mode default** (Cortex targets a broader audience than the Overmind dashboard)

| Element | Value |
|---------|-------|
| Body background | `#E8E8EE` (warm gray) |
| Panels/cards | `#FFFFFF` (white, elevated above body) |
| Accent | `#5BA3D9` (light blue) |
| Font sans | Inter |
| Font mono | JetBrains Mono |
| Base font size | 14px |
| Line height | 1.6 |
| Default radius | 8px |

Dark mode is supported via `prefers-color-scheme: dark` — no toggle needed for MVP.

---

## Elevation System

The core visual concept: **white surfaces float above a warm gray body**. Higher = more important.

```
Level       Variable          Light Value        Use For
─────────────────────────────────────────────────────────
L0 body     --bg-base         #E8E8EE            Page canvas
L0.5        --bg-backdrop     #DDDDE5            Slightly recessed
L1          --bg-surface      #FFFFFF            Panels, sidebars
L1          --bg-panel        #FFFFFF            Workspace areas
L1.5        --bg-card         rgba(0,0,0,0.03)   Cards on surfaces
L1.5 hover  --bg-card-hover   rgba(0,0,0,0.05)   Card hover state
L2          --bg-raised       rgba(0,0,0,0.06)   Raised elements
L3          --bg-overlay      rgba(255,255,255,0.95)  Modals, popovers
```

### Ingrained (Pressed) Pattern

The signature interactive element. Buttons that look **pressed into the surface** — their background matches the body level, creating a recessed effect on white panels.

```
State       Variable                Light Value
──────────────────────────────────────────────────
Default     --bg-ingrained          #E8E8EE (= body)
Hover       --bg-ingrained-hover    #DDDDE5
Active      --bg-ingrained-active   #D2D2DA
```

Use for: secondary actions, toggle buttons, tab backgrounds, filter chips.

```tsx
<Button variant="ingrained">Settings</Button>
```

---

## Glass Utilities

CSS classes for consistent panel styling:

| Class | Use | Effect |
|-------|-----|--------|
| `.glass-panel` | Structural panels | Opaque white, subtle border + shadow |
| `.glass-card` | Content cards | Subtle bg, border, shadow, hover lift |
| `.glass-float` | Popovers, dropdowns | Blurred backdrop, floating shadow |
| `.glass-modal` | Dialogs | Heavy blur, modal-weight shadow |

```tsx
// A floating panel
<div className="glass-panel rounded-lg p-4">
  Content here
</div>

// A card that lifts on hover
<div className="glass-card p-4">
  Topic summary
</div>
```

---

## Color Tokens

### Category Colors (for topic badges)

| Category | Color | Variable |
|----------|-------|----------|
| Breaking | Red `#E05A4B` | `--color-cat-breaking` |
| Paper | Blue `#5BA3D9` | `--color-cat-paper` |
| Trending | Orange `#D4922A` | `--color-cat-trending` |
| Repo | Green `#3BB87A` | `--color-cat-repo` |
| Podcast | Purple `#9B6ED0` | `--color-cat-podcast` |

### Status Colors (for topic status)

| Status | Color | Variable |
|--------|-------|----------|
| New | Blue `#5BA3D9` | `--color-status-new` |
| Read | Green `#3BB87A` | `--color-status-read` |
| Archived | Gray `#6A6A7A` | `--color-status-archived` |

### Text Hierarchy

| Level | Variable | Light | Use |
|-------|----------|-------|-----|
| Primary | `--color-text` | `#111118` | Headings, body text |
| Muted | `--color-text-muted` | `#5A5A6E` | Secondary text, descriptions |
| Subtle | `--color-text-subtle` | `#9898A8` | Placeholders, timestamps |
| Ghost | `--color-text-ghost` | `#C0C0CC` | Disabled, decorative |

### Borders

| Level | Variable | Use |
|-------|----------|-----|
| Default | `--color-border` | Card borders, dividers |
| Subtle | `--color-border-subtle` | Very light separators |
| Strong | `--color-border-strong` | Scrollbar thumbs, emphasis |
| Accent | `--color-border-accent` | Focus rings, active states |
| Glass | `--color-border-glass` | Glass panel borders |

---

## Shadows

| Token | Use |
|-------|-----|
| `--shadow-card` | Default card resting state |
| `--shadow-card-hover` | Card hover — slightly lifted |
| `--shadow-panel` | Structural panels |
| `--shadow-float` | Popovers, dropdowns |
| `--shadow-modal` | Full modals |
| `--shadow-glow` | Accent focus ring glow |

---

## Components

All in `frontend/src/components/ui/`. Use `cn()` from `@/lib/utils` for class merging.

### Button

```tsx
import { Button } from '@/components/ui/button'

<Button>Primary Action</Button>               // solid blue
<Button variant="ghost">Cancel</Button>       // transparent, hover bg
<Button variant="outline">Details</Button>    // bordered
<Button variant="accent">Dive Deeper</Button> // blue bg glow → solid on hover
<Button variant="ingrained">Filter</Button>   // pressed/recessed
<Button variant="destructive">Delete</Button> // red border
<Button size="sm">Small</Button>              // compact
<Button size="icon"><X /></Button>             // square icon button
```

### Badge

```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="breaking">Breaking</Badge>    // red
<Badge variant="paper">Paper</Badge>          // blue
<Badge variant="trending">Trending</Badge>    // orange
<Badge variant="repo">Repo</Badge>            // green
<Badge variant="podcast">Podcast</Badge>      // purple
<Badge variant="new">New</Badge>              // blue (status)
<Badge variant="read">Read</Badge>            // green (status)
```

### Tabs (Radix)

For simple tab switching (template editor, knowledge base filters):

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="sources">
  <TabsList>
    <TabsTrigger value="sources">Sources</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="sources">...</TabsContent>
  <TabsContent value="settings">...</TabsContent>
</Tabs>
```

The TabsList has an ingrained background. Active tab gets a white surface + card shadow — it "pops up" from the recessed track.

### Dockview (Learning Page)

For the Learning page's dynamic workspace with draggable/resizable tabs:

```tsx
import { DockviewReact } from 'dockview'

// Register panel components, sync with Zustand store
// See AgentSystem's DockviewWorkspace.tsx for the full pattern
```

### Dialog, Popover, ScrollArea

Standard Radix wrappers with glass styling applied. See `components/ui/` files.

---

## Motion

| Token | Duration | Use |
|-------|----------|-----|
| `--dur-fast` | 80ms | Micro-interactions (button press) |
| `--dur-normal` | 150ms | Standard transitions |
| `--dur-enter` | 200ms | Elements entering |
| `--dur-expand` | 250ms | Expanding panels |
| `--dur-complex` | 350ms | Multi-step animations |

Easing: `--ease-standard` for most, `--ease-enter` for appearing, `--ease-spring` for playful.

---

## Layout Patterns

### Page Layout
```tsx
<div className="min-h-dvh bg-[var(--bg-base)]">
  <nav className="glass-panel border-b border-[var(--color-border)]">
    {/* Navigation */}
  </nav>
  <main className="max-w-5xl mx-auto px-4 py-8">
    {/* Page content */}
  </main>
</div>
```

### Card Grid (Pulse page)
```tsx
<div className="grid gap-4">
  {topics.map(topic => (
    <div key={topic.slug} className="glass-card p-4">
      <Badge variant={topic.category}>{topic.category}</Badge>
      <h3 className="text-sm font-semibold mt-2">{topic.title}</h3>
      <p className="text-[var(--color-text-muted)] text-sm mt-1">{topic.summary}</p>
      <Button variant="accent" size="sm" className="mt-3">Dive Deeper</Button>
    </div>
  ))}
</div>
```

### Split View (Template editor)
```tsx
<div className="flex h-[calc(100dvh-4rem)]">
  <div className="flex-1 glass-panel rounded-lg p-4 overflow-auto">
    {/* Template form */}
  </div>
  <div className="w-96 ml-4">
    {/* CopilotKit chat panel */}
  </div>
</div>
```

### TL;DR Box (Pulse top)
```tsx
<div className="glass-card p-5 mb-6 border-l-4 border-l-[var(--color-accent)]">
  <h2 className="text-sm font-semibold flex items-center gap-2">
    TL;DR — While you slept
  </h2>
  <p className="text-[var(--color-text-muted)] text-sm mt-2">
    3 new papers on inference optimization, Gemini 4 launched...
  </p>
</div>
```

---

## File Reference

| File | What |
|------|------|
| `frontend/src/tailwind.css` | All design tokens (colors, shadows, motion, glass classes) |
| `frontend/src/lib/utils.ts` | `cn()` class merging utility |
| `frontend/src/components/ui/button.tsx` | Button with 6 variants |
| `frontend/src/components/ui/badge.tsx` | Badge with category + status variants |
| `frontend/src/components/ui/tabs.tsx` | Radix tabs with ingrained styling |
| `frontend/src/components/ui/scroll-area.tsx` | Radix scroll area |
| `frontend/src/components/ui/dialog.tsx` | Radix dialog with glass-modal |
| `frontend/src/components/ui/popover.tsx` | Radix popover with glass-float |
