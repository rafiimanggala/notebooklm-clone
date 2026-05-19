# NotebookLM UI Specification (as of May 2026)

Comprehensive visual design reference for replicating Google NotebookLM's interface.

---

## 1. Design System Foundation

### Design Language
- **Based on**: Material Design 3 (M3) with Google Labs custom extensions
- **NOT a strict M3 implementation** — uses M3 principles (tonal surfaces, dynamic color, elevation) with custom brand layer from Google Labs
- Won 2026 Webby for "Best AI User Experience"

### Typography
- **Primary font**: `Google Sans Text` (body, UI elements, smaller text)
- **Display/headings font**: `Google Sans` (larger headings, titles, branding)
- **Fallback stack**: `"Google Sans", "Google Sans Text", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace** (code): `Google Sans Mono` / `Google Sans Code`
- **Icon font**: Material Symbols Rounded (variable font, weight 400, optical size 24, rounded style)

#### Type Scale (estimated from inspection)
| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Display / Page Title | 28-32px | 400 | 1.2 |
| Heading (H1) | 24px | 500 | 1.3 |
| Heading (H2) | 20px | 500 | 1.3 |
| Heading (H3) | 16px | 500 | 1.4 |
| Body Large | 16px | 400 | 1.5 |
| Body Medium | 14px | 400 | 1.5 |
| Body Small | 13px | 400 | 1.4 |
| Label / Caption | 12px | 500 | 1.3 |
| Button text | 14px | 500 | 1.0 |

### Color System

#### Light Theme
| Token | Hex (estimated) | Usage |
|-------|-----------------|-------|
| Background | `#FFFFFF` | Page background |
| Surface | `#F8F9FA` | Cards, panels, elevated surfaces |
| Surface Container | `#F1F3F4` | Secondary surfaces, sidebar bg |
| Surface Container High | `#E8EAED` | Elevated containers, hover states |
| On Surface | `#1F1F1F` / `#202124` | Primary text |
| On Surface Variant | `#5F6368` | Secondary text, labels |
| Primary | `#1A73E8` | Primary actions, links, active states (Google Blue) |
| Primary Container | `#D2E3FC` | Selected state backgrounds, light blue tint |
| On Primary | `#FFFFFF` | Text on primary buttons |
| Secondary | `#1967D2` | Secondary interactive elements |
| Tertiary / Accent | `#137333` | Success states, green accents |
| Error | `#D93025` | Error states (Google Red) |
| Outline | `#DADCE0` | Borders, dividers |
| Outline Variant | `#E8EAED` | Subtle borders |
| Shadow | `rgba(0,0,0,0.1)` | Elevation shadow |
| Scrim | `rgba(0,0,0,0.32)` | Modal overlay |

#### Dark Theme
| Token | Hex (estimated) | Usage |
|-------|-----------------|-------|
| Background | `#1F1F1F` / `#202124` | Page background |
| Surface | `#292A2D` / `#303134` | Cards, panels |
| Surface Container | `#35363A` | Secondary surfaces |
| On Surface | `#E8EAED` | Primary text |
| On Surface Variant | `#9AA0A6` | Secondary text |
| Primary | `#8AB4F8` | Primary actions, links (lighter Google Blue) |
| Primary Container | `#394457` | Selected states |
| Outline | `#5F6368` | Borders, dividers |

#### Studio Output Type Colors (accent per type)
Each Studio output type has a distinct accent color for its icon/badge:
| Output Type | Accent Color (approx) |
|-------------|----------------------|
| Audio Overview | Blue-purple `#7B61FF` or `#A142F4` |
| Video Overview | Coral/Red `#E8453C` |
| Mind Map | Teal `#129EAF` |
| Study Guide | Green `#34A853` |
| Briefing Doc | Blue `#4285F4` |
| FAQ | Orange `#FA903E` |
| Reports | Indigo `#5F6368` |
| Flashcards | Yellow-green `#7CB342` |
| Quiz | Purple `#9334E6` |
| Infographic | Pink `#E91E63` |
| Slide Deck | Red-orange `#EA4335` |
| Notes | Grey `#80868B` |

### Spacing Scale
Follows M3 4px base unit:
```
4px | 8px | 12px | 16px | 20px | 24px | 32px | 40px | 48px | 64px
```

### Border Radius
| Element | Radius |
|---------|--------|
| Small chips/badges | 8px |
| Buttons | 20px (pill-shaped for primary), 8px (secondary) |
| Cards | 12px |
| Panels | 16px (top corners of slide-up panels) |
| Modal/Dialog | 28px (M3 large shape) |
| Input fields | 24px (pill-shaped chat input) |
| Avatars/Icons | 50% (circle) |
| Mind map nodes | 8-12px |
| Source items | 8px |

### Shadows & Elevation
- M3 tonal elevation (subtle tint) preferred over heavy box-shadow
- Level 0: No shadow (flat surface)
- Level 1: `0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)` — cards at rest
- Level 2: `0 2px 6px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)` — hovered cards, dropdowns
- Level 3: `0 8px 24px rgba(0,0,0,0.12)` — modals, dialogs
- Dark theme: tonal overlay from primary color instead of shadow

### Transitions
- Duration: `150ms` (micro), `200ms` (hover), `300ms` (panel expand/collapse), `400ms` (page transitions)
- Easing: M3 standard — `cubic-bezier(0.2, 0, 0, 1)` (emphasize decelerate)
- Panel resize: smooth `300ms` with easing
- Chat messages: fade-in with slight upward slide

---

## 2. Home / Dashboard Page

### Layout
- **Max width**: ~1200px centered, with horizontal padding 24px
- **Header**: Sticky top bar with NotebookLM logo (left), search bar (center), settings gear + profile avatar (right)
- **Logo**: "NotebookLM" wordmark in Google Sans, with a small sparkle/notebook icon

### Notebook Grid
- **View toggle**: Grid view (default) | List/Table view — toggle in top-right area
- **Sort options**: "Most recent" (default) | "Title A-Z" | dropdown selector
- **Search**: Instant search bar to filter notebooks

### Notebook Cards (Grid View)
- **Dimensions**: ~240px wide, ~160px tall (responsive)
- **Background**: `Surface` color (`#F8F9FA`)
- **Border**: 1px `Outline` (`#DADCE0`)
- **Border-radius**: 12px
- **Padding**: 16px
- **Content**:
  - Top-left: Large emoji (auto-generated from content, clickable to customize via emoji picker)
  - Title: Google Sans, 16px, weight 500, max 2 lines with ellipsis
  - Subtitle/date: 12px, `On Surface Variant` color, "Last opened [date]"
  - Bottom: Source count badge ("3 sources"), permission badge if shared
- **Hover**: Slight elevation increase (shadow Level 2), subtle background tint
- **3-dot menu**: Top-right corner on hover — rename, share, delete, move to folder

### Create Button
- **Position**: Prominent, either top-left below header or as a card in the grid (first position)
- **Style**: Outlined/Ghost button or a "+" card with dashed border
- **Text**: "New notebook" or just "+" icon
- **On click**: Opens source upload modal directly (or blank notebook)

### Folders
- Notebooks can be organized into folders
- Folder view with breadcrumb navigation

---

## 3. Notebook Page — 3-Panel Layout

### Overall Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header Bar (notebook title, back button, settings)         │
├───────────┬──────────────────────────┬──────────────────────┤
│           │                          │                      │
│  Sources  │       Chat               │      Studio          │
│  Panel    │       Panel              │      Panel           │
│  (~250px) │       (flexible)         │      (~320px)        │
│           │                          │                      │
│           │                          │                      │
│           │                          │                      │
│           │                          │                      │
├───────────┴──────────────────────────┴──────────────────────┤
│  (panels are resizable / collapsible)                       │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Panel Modes
Four layout configurations adapt to user focus:
1. **Standard**: All three panels visible (Sources ~250px, Chat flex, Studio ~320px)
2. **Reading + Chat**: Sources expanded, Studio collapsed to icon strip
3. **Chat + Writing**: Sources collapsed, Studio expanded
4. **Reading + Writing**: Chat minimized

Panels retain essential icons (sources icon, notes icon) even at minimum width.

### Header Bar
- **Height**: ~56-64px
- **Background**: `Background` white / dark bg
- **Left side**:
  - Back arrow (← Material Symbol) — returns to dashboard
  - Hamburger menu (☰) for navigation (only visible inside notebook, not on dashboard)
  - Notebook emoji + title (editable inline, Google Sans 18px weight 500)
- **Right side**:
  - Share button (person+ icon)
  - Settings gear icon
  - User profile avatar (circular, 32px)
- **Bottom border**: 1px `Outline` color or no border with subtle shadow

---

## 4. Source Panel (Left)

### Panel Header
- **Title**: "Sources" in Google Sans, 14px, weight 500, uppercase or sentence case
- **"+ Add source" button**: Icon button or text button, Primary color
- **"Discover" button**: Secondary, for AI-powered source discovery via web search

### Source List
- **Layout**: Vertical list, scrollable
- **Each source item**:
  - **Height**: ~48-56px
  - **Checkbox**: Right side of source name — filled blue checkmark when selected, empty when deselected
  - **Icon**: Source type icon (PDF icon, Google Docs icon, YouTube icon, website globe icon, audio icon) — 20px, left-aligned
  - **Title**: 14px, weight 400, single line with ellipsis, max ~180px width
  - **Subtitle**: Source type label (e.g., "PDF", "Google Doc"), 12px, `On Surface Variant`
  - **Hover**: Background highlight `Surface Container`
  - **Click**: Opens source viewer in a slide-over panel or replaces chat panel
  - **3-dot menu**: Delete, rename, view source
- **Selection behavior**: By default all sources are selected (checked). Uncheck to exclude from chat context.
- **"Select all / Deselect all"**: Link text above the list

### Source Viewer
- When a source is clicked, its content opens in a reading view
- Citations in chat can be clicked to auto-scroll to the relevant passage in the source viewer
- Highlighted passages shown with Primary Container background tint

### Add Source Modal
- **Trigger**: "+" button in source panel
- **Style**: Large centered dialog, border-radius 28px, scrim overlay
- **Sections/Tabs in the modal**:
  1. **Upload file**: Drag-and-drop zone (large dashed border area), supported: PDF, .txt, .md, Markdown, audio files (.mp3, .wav)
  2. **Google Drive**: Connect to Docs, Slides, Sheets — file picker
  3. **Link / Website**: Text input for URLs (paste one or multiple, separated by newlines)
  4. **YouTube**: URL input specifically for YouTube video links
  5. **Paste text**: Large textarea for raw text pasting, with title field above
- **Drag-and-drop area**: Dominates the modal (noted as a UX issue — too large)
- **Source limit**: Up to 50 sources, 500K words or 200MB per source
- **Upload progress**: Linear progress bar or circular spinner

---

## 5. Chat Panel (Center)

### Overall Layout
- Flexible width, takes remaining space between Sources and Studio
- Scrollable message area with input fixed at bottom

### Welcome State (Empty Chat)
- Large centered text: "Ask about your sources" or similar
- Suggested question chips below — pill-shaped, outlined, clickable
- Gemini sparkle icon or NotebookLM logo watermark

### Message Thread
- **AI messages**: Left-aligned, no bubble background (or very subtle Surface tint)
  - AI avatar: Small circular Gemini/NotebookLM icon (24px)
  - Text: 14-16px, Google Sans Text, `On Surface` color
  - **Inline citations**: Small numbered badges in grey ovals (e.g., `[1]`, `[2]`, `[3]`)
    - Style: ~20px wide pill, `Surface Container` background, 12px text, border-radius 10px
    - Hover: Tooltip showing the full quoted text from source
    - Click: Opens source viewer and auto-scrolls to the quoted passage
  - Action buttons below message: Copy, 👍 thumbs up, 👎 thumbs down, "Save to Note" button
- **User messages**: Right-aligned with subtle Primary Container background tint
  - Border-radius: 20px (bubble shape)
  - Padding: 12px 16px
  - Text: 14px, `On Surface`

### Suggested Questions
- Appear below AI responses as clickable chips
- Style: Outlined pills, border 1px `Outline`, text `Primary` color, 13px
- Hover: Background fill with `Primary Container`
- Also appear in welcome state

### Chat Input Area
- **Position**: Fixed at bottom of chat panel
- **Shape**: Pill-shaped input, border-radius 24px
- **Border**: 1px `Outline`, focus: 2px `Primary`
- **Height**: ~48px (auto-expands for multiline)
- **Placeholder**: "Ask about your sources..." in `On Surface Variant`
- **Send button**: Right side inside input, circular icon button with arrow-up icon, `Primary` color when text is present, disabled/grey when empty
- **Above input**: Action chips row — "Summarize", "Create study guide", "Ask a question" etc.

### Chat Customization
- "Configure Chat" option (gear icon or settings link in chat header)
- Opens a panel to set custom instructions/persona for the AI
- Option to clear chat history

---

## 6. Studio Panel (Right)

### Panel Header
- **Title**: "Studio" in Google Sans, 16px, weight 500
- **Minimize/expand**: Collapse button (chevron or panel icon)

### Output Type Grid
The Studio presents output generation as a grid/list of actionable buttons:

```
┌─────────────────────────────────┐
│  Studio                         │
├─────────────────────────────────┤
│                                 │
│  [🎙 Audio Overview]  [▶ ...]  │
│                                 │
│  ┌──────────┐ ┌──────────┐     │
│  │📹 Video  │ │🧠 Mind   │     │
│  │Overview  │ │   Map    │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │📄 Study  │ │📋 Brief  │     │
│  │  Guide   │ │   Doc    │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │❓ FAQ    │ │📊 Report │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │🃏 Flash  │ │📝 Quiz   │     │
│  │  cards   │ │          │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │📊 Info   │ │📑 Slide  │     │
│  │ graphic  │ │  Deck    │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │📋 Data   │ │📝 Note   │     │
│  │  Table   │ │          │     │
│  └──────────┘ └──────────┘     │
│                                 │
│  ── Generated Content ────      │
│  [Previously generated items]   │
│                                 │
└─────────────────────────────────┘
```

### Output Type Buttons
- **Layout**: 2-column grid of square-ish cards
- **Card size**: ~140px x ~80px each (responsive)
- **Style**: `Surface` background, 1px `Outline` border, border-radius 12px
- **Content**: Colored icon (Material Symbol, ~24px) + label text (13-14px, weight 500)
- **Hover**: Elevation increase, subtle tint of the output type's accent color
- **Click**: Opens generation panel/dialog with customization options

### Audio Overview Section (Special — Prominent)
- **Position**: Top of Studio panel, larger than other buttons
- **Player UI** (after generation):
  - Waveform or progress bar visualization
  - Play/Pause button (large, circular, `Primary` color)
  - Playback speed control (3-dot menu)
  - Thumbs up / Thumbs down feedback
  - Share button + Download button
  - "Interactive" mode toggle (join the conversation)
- **Generation UI**:
  - Format selector: Deep Dive (2 hosts), The Brief (1 speaker), The Critique, The Debate
  - Language dropdown (80+ languages)
  - Length: Shorter / Default / Longer
  - Custom prompt textarea
  - "Generate" button — Primary filled

### Generated Content List
- Below the generation buttons
- Shows previously generated outputs as cards/list items
- Each item: icon + title + timestamp + 3-dot menu (delete, download, share)
- Click to open/view the generated content

### Reports (Dynamic Suggestions)
- Reports dynamically suggest formats based on source content themes
- E.g., "Glossary of Key Terms", "Magazine-style Explainer" — contextual

---

## 7. Flashcard / Quiz UI

### Generation Dialog
- **Customization panel** before generating:
  - Number of cards: "Fewer" | "Standard" | "More" — segmented button/toggle
  - Difficulty: "Easy" | "Medium" | "Hard" — segmented button
  - Language selector
  - Custom prompt textarea (focus area)
  - "Generate" button — Primary filled

### Flashcard Full-Screen View
- **Layout**: Full-screen overlay / modal taking over the viewport
- **Similar to Quizlet** in interaction pattern

#### Card Display
- **Card**: Large centered card, ~400-500px wide, ~300px tall
  - Background: White / Surface
  - Border-radius: 16px
  - Shadow: Level 2
  - Padding: 32px
- **Front**: Question text, centered, 18-20px, weight 400
- **Flip animation**: 3D card flip (rotateY 180deg), ~300ms transition
- **Back**: Answer text + "Explain" button (text button, `Primary` color)
  - Explain: Generates detailed explanation with source citations

#### Navigation & Progress
- **Bottom controls**:
  - Left arrow (←) Previous card
  - Card counter: "3 / 15" centered, 14px
  - Right arrow (→) Next card
- **Top-right controls**: Fullscreen toggle, shuffle, restart, download CSV, delete, close (X)
- **Progress actions**:
  - "Got it!" button — Checkmark icon, green accent, right side
  - "Missed it!" button — X icon, red/error accent, left side
  - NotebookLM remembers which cards were missed

#### End Screen
- Summary: "You got X out of Y correct"
- Retry options: "Same cards" | "All cards" | "Only cards you missed"
- Generate study guide from missed cards

### Quiz Full-Screen View
- **Layout**: Full-screen overlay similar to flashcards

#### Question Display
- **Question**: Large text, 18px, weight 400, top of card
- **Multiple choice options**: 4 options as radio-button cards
  - Each option: Outlined card, ~full-width, padding 12px 16px
  - Border: 1px `Outline`, border-radius 12px
  - Hover: `Surface Container` background
  - Selected: `Primary Container` background, `Primary` border
  - Correct: Green border + green checkmark icon
  - Incorrect: Red border + red X icon
- **Hint button**: Below options, text button "Hint" — reveals contextual clue
- **After answering**: Explanation panel slides in below the selected answer
  - Shows why correct/incorrect with citations

#### Navigation
- Previous / Next arrows at bottom
- Question counter: "Question 5 of 10"
- Progress bar at top (linear, thin, `Primary` color fill)

#### End Screen
- Score: "You scored 8/10" (large text)
- Per-question review available
- Options: Retry, generate flashcards from wrong answers, generate study guide

---

## 8. Mind Map

### Display
- **Location**: Opens in Studio panel or expands to full-screen
- **Canvas**: Infinite-scroll canvas with zoom and pan
- **Background**: White / subtle dot grid pattern

### Nodes
- **Central node**: Larger, `Primary` color background or strong accent
  - Text: 16px, white, weight 500
  - Border-radius: 12px
  - Padding: 12px 20px
- **Branch nodes**: Medium size, lighter color per branch
  - Each main branch gets a distinct color from the output accent palette
  - Text: 14px, `On Surface`, weight 400
  - Border-radius: 8px
  - Padding: 8px 16px
  - Background: Light tint of branch color
- **Leaf nodes**: Smallest, subtle background
  - Text: 13px
  - Hover: Slight scale + shadow

### Connections
- **Lines**: Curved bezier paths connecting parent-child nodes
- **Color**: Matches branch color or neutral grey
- **Width**: 2px, slightly rounded ends

### Interaction
- **Zoom**: Scroll wheel or pinch, smooth transition
- **Pan**: Click and drag on canvas
- **Expand/Collapse**: Click chevron on node to show/hide children
- **Node click**: Sends question about that topic to chat panel
- **Hover**: Node highlights with subtle glow/shadow

### Controls (Top-Right)
- Zoom in (+) / Zoom out (-) buttons
- Fit to screen button
- Expand all / Collapse all
- Download as PNG
- Full screen toggle
- Close (X)

---

## 9. Video Overview Player

### Player UI
- **Video area**: 16:9 aspect ratio, centered in Studio panel or full-screen
- **Controls bar** (bottom):
  - Play/Pause (large, center)
  - Progress slider/scrubber
  - Rewind / Skip forward buttons
  - Full-screen toggle
  - Volume control
  - Playback speed
  - Share button
- **Visual styles** (selectable before generation):
  - Classic, Whiteboard, Watercolor, Retro Print, Heritage, Paper-craft, Kawaii, Anime
- **Format options**: Cinematic (animated), Explainer, Brief

---

## 10. Notes Section

### Note Types (Color-Coded)
- **Written Note** (user-created): Green label badge
- **Saved Response** (from chat): Blue label badge
- **Generated content**: Grey or accent-colored label

### Note Editor
- Rich text editor in Studio panel
- Toolbar: Bold, Italic, Heading, Bullet list, Numbered list, Code block
- Auto-save behavior

---

## 11. Component Library Reference

### Buttons
| Variant | Style |
|---------|-------|
| Primary Filled | `Primary` bg, white text, border-radius 20px, height 40px, padding 0 24px |
| Primary Outlined | Transparent bg, `Primary` text + border, same shape |
| Tonal | `Primary Container` bg, `Primary` text |
| Text/Ghost | No bg/border, `Primary` text, hover: subtle tint |
| Icon Button | 40px circle, icon 20px, ghost or tonal |
| FAB (Floating Action Button) | 56px, Primary bg, large icon, border-radius 16px, shadow Level 2 |

### Chips / Badges
- **Suggested question chip**: Outlined pill, `Outline` border, `On Surface` text, height 32px, padding 0 16px, border-radius 16px
- **Citation badge**: Inline, `Surface Container` bg, 12px text, border-radius 10px, ~20px height
- **Source type badge**: Small, 10px text, specific color per type
- **Filter chip**: Selectable, filled when active (`Primary Container`)

### Cards
- **Background**: `Surface` or `Background`
- **Border**: 1px `Outline`
- **Border-radius**: 12px
- **Padding**: 16px
- **Hover**: Shadow Level 2, or tonal tint
- **Active/Selected**: `Primary Container` background, `Primary` border

### Input Fields
- **Chat input**: Pill shape, 48px height, border-radius 24px, 1px `Outline` border
- **Text area**: Rectangle, border-radius 8px, 1px `Outline`, padding 12px
- **Search**: Pill shape with search icon left, similar to chat input

### Dialogs / Modals
- **Scrim**: `rgba(0,0,0,0.32)` overlay
- **Container**: White/Surface bg, border-radius 28px, shadow Level 3
- **Max-width**: 560px for standard, 680px for source upload
- **Padding**: 24px
- **Header**: 24px Google Sans weight 500 title
- **Actions**: Right-aligned buttons at bottom

### Tooltips
- Background: `#2E2F31` (dark), border-radius 8px
- Text: 12px white
- Arrow/caret pointing to trigger
- Fade-in 150ms

### Snackbar / Toast
- Bottom-center positioned
- Dark background `#323232`, white text
- Border-radius: 8px
- Optional action button (text, `Primary` color on dark)
- Auto-dismiss after 4-6 seconds

---

## 12. Icons Reference (Material Symbols Rounded)

Key icons used throughout the interface:
| Context | Icon Name |
|---------|-----------|
| Back | `arrow_back` |
| Close | `close` |
| Settings | `settings` |
| Share | `person_add` |
| Menu | `menu` |
| Search | `search` |
| Add source | `add` / `upload_file` |
| Send message | `arrow_upward` (in circle) |
| Copy | `content_copy` |
| Thumbs up | `thumb_up` |
| Thumbs down | `thumb_down` |
| Save to note | `bookmark` / `note_add` |
| Audio Overview | `headphones` / `mic` |
| Video Overview | `videocam` / `play_circle` |
| Mind Map | `hub` / `account_tree` |
| Study Guide | `school` / `menu_book` |
| FAQ | `help` / `quiz` |
| Briefing Doc | `summarize` / `description` |
| Flashcards | `style` / `flip` |
| Quiz | `assignment` / `fact_check` |
| Reports | `analytics` / `bar_chart` |
| Timeline | `timeline` |
| Source: PDF | `picture_as_pdf` |
| Source: Doc | `article` / `description` |
| Source: Web | `language` / `public` |
| Source: YouTube | `smart_display` / `play_circle` |
| Source: Audio | `audio_file` / `headphones` |
| Expand panel | `chevron_right` |
| Collapse panel | `chevron_left` |
| Full screen | `fullscreen` |
| Download | `download` |
| Delete | `delete` |
| Edit | `edit` |
| More options | `more_vert` |
| Checkmark (source selected) | `check_circle` |
| Shuffle | `shuffle` |
| Restart | `restart_alt` |
| Zoom in | `zoom_in` |
| Zoom out | `zoom_out` |

---

## 13. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| ≥ 1440px | Full 3-panel layout, comfortable spacing |
| 1024-1439px | 3 panels, narrower sources/studio (~200px / ~280px) |
| 768-1023px | 2 panels visible, third collapses to icon strip |
| < 768px | Single panel mode, bottom tabs to switch (mobile app-like) |

### Mobile App Layout
- Bottom navigation bar with tabs: Sources, Chat, Studio
- Each panel takes full width
- Swipe gestures for panel switching
- Chat input with floating keyboard

---

## 14. Animation & Interaction Patterns

| Interaction | Animation |
|-------------|-----------|
| Panel expand/collapse | Width transition 300ms, ease-out |
| Chat message appear | Fade in + slide up 16px, 200ms |
| Citation hover | Tooltip fade in 150ms |
| Card flip (flashcard) | 3D rotateY 180deg, 300ms, ease-in-out |
| Modal open | Scale from 0.9→1.0 + fade in, 200ms |
| Modal close | Fade out + scale to 0.95, 150ms |
| Button hover | Background color shift, 150ms |
| Button press | Scale 0.98, 100ms |
| Mind map zoom | Smooth transform scale, 200ms |
| Chip click | Ripple effect (M3 ripple) |
| Source toggle | Checkbox fill animation, 150ms |
| Progress bar | Width transition 300ms |
| Skeleton loading | Shimmer gradient animation, 1.5s loop |
| Text streaming (chat) | Token-by-token text appear (noted: currently loads all at once, expected to stream) |

---

## 15. Loading & Empty States

### Loading States
- **Generating content**: Skeleton shimmer cards or animated dots ("...")
- **Audio generating**: "Generating Audio Overview..." with progress indicator, background generation supported
- **Source uploading**: Linear progress bar within source panel

### Empty States
- **No sources**: Illustration + "Add your first source" with prominent upload button
- **No chat history**: Large centered prompt suggestions + Gemini sparkle
- **No generated content in Studio**: Output type buttons visible, no generated items list

---

## 16. Key UX Patterns to Note

1. **Content-first, not prompt-first**: User starts by uploading sources, not typing a prompt
2. **Grounded responses**: All AI responses cite sources with inline numbered badges
3. **Context persistence**: Sources panel always visible/accessible, even at minimum width
4. **Parallel generation**: Can generate Audio Overview in background while chatting
5. **One-click generation**: Studio outputs are single-click, with optional customization
6. **Progressive disclosure**: Advanced options (custom prompts, difficulty, language) hidden behind customization panels
7. **Streaming text**: AI responses should stream token-by-token (industry standard, though NotebookLM had issues with this)
8. **Source grounding indicator**: Visual feedback showing which sources are being referenced

---

## 17. Page-by-Page Summary

### Dashboard (`/`)
- Grid of notebook cards with emoji covers
- Create new notebook button
- Folder organization
- Search + Sort + View toggle (grid/list)
- Minimal header with logo + profile

### Notebook View (`/notebook/:id`)
- 3-panel layout: Sources | Chat | Studio
- Header with back button + notebook title + share + settings
- Resizable panels with collapse/expand
- Fixed chat input at bottom of center panel

### Source Upload Modal (overlay)
- Tabbed/segmented: Upload | Drive | Link | YouTube | Paste
- Large drag-and-drop zone
- File type icons and limits shown

### Flashcard View (full-screen overlay)
- Large centered flip card
- Navigation arrows + counter
- Got it / Missed it buttons
- Progress persistence
- End summary screen

### Quiz View (full-screen overlay)
- Question + 4 multiple choice cards
- Hint button
- Per-answer explanation
- Progress bar + score at end

### Mind Map View (studio panel or full-screen)
- Interactive canvas with zoom/pan
- Hierarchical colored nodes
- Click node → chat about topic
- Export as PNG

### Audio Player (in studio panel)
- Waveform/progress bar
- Play/Pause + speed + download + share
- Interactive mode button
- Format labels (Deep Dive, Brief, etc.)

---

*Note: Exact hex values, font sizes, and spacing measurements are estimates based on visual inspection and Material Design 3 guidelines. For pixel-perfect accuracy, inspect the live application at https://notebooklm.google.com using browser DevTools.*
