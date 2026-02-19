# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **mobile-first** React-based daily accountability tracking application that allows multiple users (Abraham, Carlo, Stefania) to create daily task lists, mark items as complete/partial/incomplete with emoji indicators, and export formatted lists for WhatsApp. The application uses Convex as the backend database with simple localStorage-based user selection.

**Design Philosophy**: All UI components and layouts should prioritize mobile devices. Design for small screens first, then enhance for larger viewports if needed.

**User System**: Simple username-based separation with no authentication. Users select their profile on first visit, and the selection persists in localStorage. Each user sees only their own lists.

## Development Commands

### Running the Application
```bash
npm run dev          # Start Vite dev server (frontend)
npx convex dev       # Start Convex backend in development mode
```

You need to run BOTH commands concurrently in separate terminals for full functionality.

### Building and Linting
```bash
npm run build        # Compile TypeScript and build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Architecture

### Backend: Convex
- **Location**: [convex/](convex/) directory
- **Schema**: [convex/schema.ts](convex/schema.ts) - Defines two main tables:
  - `dailyLists` table with userId and date compound-indexed entries
  - `weeklyGoals` table with userId, weekStart, weekNumber, year indexes
- **Daily Lists Functions**: [convex/dailyLists.ts](convex/dailyLists.ts) - Contains queries and mutations (all require userId parameter):
  - `getTodaysList` - Fetches today's list for a specific user
  - `getListByDate` - Fetches a specific date's list for a user
  - `getAllLists` - Fetches all historical lists for a user
  - `upsertTodaysList` - Creates or updates today's list for a user (includes userId and section field)
  - `markTodaysListCompleted` - Marks today's list as completed for a user
  - `revertTodaysListToDraft` - Reverts a completed day back to draft mode for a user
  - `updateItemsWithEmojis` - Updates emoji assignments for items for a user
- **Weekly Goals Functions**: [convex/weeklyGoals.ts](convex/weeklyGoals.ts) - Contains queries and mutations for weekly goals:
  - `getCurrentWeekGoals` - Fetches current week's goals for a user
  - `initializeCurrentWeek` - Creates new week with auto-carryover from previous week
  - `getGoalsByWeek` - Fetches specific week's goals by weekStart date
  - `getAllWeeklyGoals` - Fetches last 12 weeks of goals for a user
  - `upsertCurrentWeekGoals` - Creates or updates current week's goals
  - `markCurrentWeekCompleted` - Marks current week as completed
  - `revertCurrentWeekToDraft` - Reverts current week back to draft mode
  - `updateWeekItemsWithEmojis` - Updates emoji assignments for weekly items
  - `getDaysSinceLastUpdate` - Returns days since last weekly update (for 7-day reminder)
- **Week Utilities**: [convex/weekUtils.ts](convex/weekUtils.ts) - Week calculation helpers using ISO 8601 standard (Monday-Sunday)

### Frontend: React + TypeScript + Vite
- **Main Components**:
  - [src/components/AccountabilityApp.tsx](src/components/AccountabilityApp.tsx) - Main application interface for managing today's list, handles user selection, shows weekly reminder banner
  - [src/components/HistoryView.tsx](src/components/HistoryView.tsx) - View for browsing past days' lists (filtered by user)
  - [src/components/WeeklyGoalsApp.tsx](src/components/WeeklyGoalsApp.tsx) - Weekly goals interface with simplified list (no sections)
  - [src/components/WeeklyHistoryView.tsx](src/components/WeeklyHistoryView.tsx) - View for browsing past weeks' goals (last 12 weeks)
  - [src/components/UserPicker.tsx](src/components/UserPicker.tsx) - Full-screen user selection interface with avatar cards
  - [src/components/UserAvatar.tsx](src/components/UserAvatar.tsx) - Small avatar badge displayed in top-right corner
- **UI Components**: [src/components/ui/](src/components/ui/) - shadcn/ui components (radix-maia style)
- **Entry Point**: [src/main.tsx](src/main.tsx) - Initializes Convex client with `VITE_CONVEX_URL` environment variable

### Data Flow

#### Daily Lists Flow
1. **User Selection**: On first visit, user selects their profile (Abraham/Carlo/Stefania) from UserPicker
   - Selection stored in localStorage as userId
   - Small avatar badge appears in top-right corner showing current user
2. User creates a daily list in "draft" mode (can add/remove/edit items)
   - Optional: User can assign items to "Personal" or "Work" sections via dropdown
   - Inline editing: Click pencil icon to edit item text
3. User marks the day as "completed" (locks the list for review)
4. In completed mode, user assigns emoji status to each item:
   - 🟢 Green = completed successfully
   - 🟡 Yellow = partially completed (with optional explanation)
   - 🔴 Red = not completed
5. User can revert completed day back to "draft" to make changes
6. User can copy formatted list to clipboard for WhatsApp sharing
   - WhatsApp formatting groups items by section with headers
7. Historical lists are viewable in the HistoryView component (filtered by current user)

#### Weekly Goals Flow
1. User clicks "Weekly" button in navbar to access WeeklyGoalsApp
2. On first access of a new week (Monday), the system automatically:
   - Creates new week entry with ISO week number and date range
   - Checks previous week's status:
     - If previous week was **completed**: carries over only yellow/red (incomplete) items
     - If previous week was **not marked**: carries over ALL items
   - Carried-over items are flagged with "Carried Over" badge
3. User manages weekly goals in "draft" mode (add/remove/edit goals, no sections)
4. User marks the week as "completed" (locks for review)
5. In completed mode, assigns emoji status to each goal (same as daily lists)
6. User can copy formatted week to WhatsApp (includes week number and date range)
7. Historical weeks viewable in WeeklyHistoryView (last 12 weeks)
8. **7-Day Reminder**: If weekly goals haven't been updated in 7+ days, a banner appears on main daily view prompting update

### Key Data Structures

#### Daily List
```typescript
{
  userId: string,            // User identifier: "abraham", "carlo", or "stefania"
  date: string,              // YYYY-MM-DD format
  status: "draft" | "completed",
  items: Array<{
    text: string,
    emoji: "green" | "yellow" | "red" | null,
    explanation?: string,    // Only for yellow items
    section?: "personal" | "work"  // Optional subsection categorization
  }>
}
```

#### Weekly Goals
```typescript
{
  userId: string,            // User identifier: "abraham", "carlo", or "stefania"
  weekStart: string,         // YYYY-MM-DD (Monday of the week)
  weekEnd: string,           // YYYY-MM-DD (Sunday of the week)
  weekNumber: number,        // ISO week number (1-53)
  year: number,              // Year for the week
  status: "draft" | "completed",
  lastUpdated: number,       // Timestamp for 7-day reminder tracking
  items: Array<{
    text: string,
    emoji: "green" | "yellow" | "red" | null,
    explanation?: string,    // Only for yellow items
    carriedOver?: boolean    // Flag for visual "Carried Over" badge
  }>
}
```

### User Profiles
- **Abraham** - Blue avatar (A)
- **Carlo** - Green avatar (C)
- **Stefania** - Purple avatar (S)

## Configuration

### Path Aliases
- `@/*` maps to [src/*](src/)
- Configured in [tsconfig.json](tsconfig.json) and [vite.config.ts](vite.config.ts)

### shadcn/ui
- Configuration: [components.json](components.json)
- Style: radix-maia with stone base color
- Icon library: Tabler Icons (@tabler/icons-react)
- Components use Tailwind CSS v4 with CSS variables

### Environment Variables
- `VITE_CONVEX_URL` - Required for Convex client connection (defined in .env.local)

## Key Features

### User Selection
- Simple localStorage-based user selection (no authentication)
- Three predefined users: Abraham (blue), Carlo (green), Stefania (purple)
- Full-screen picker on first visit with avatar cards
- Small avatar badge in top-right corner shows current user
- Each user sees only their own lists, weekly goals, and history
- No logout functionality - users stay logged in via localStorage

### Weekly Goals System
- **Navigation**: Calendar icon button in navbar opens weekly goals section
- **Week Display**: Shows "Week X - DD Mon - DD Mon" format (e.g., "Week 4 - 16 Feb - 22 Feb")
- **Auto-Carryover**: When accessing a new week (Monday start):
  - If previous week was completed: carries over only yellow/red items
  - If previous week was not marked: carries over all items
  - Empty previous week: starts with empty list
- **Carried Over Badge**: Items carried from previous week show amber "Carried Over" badge
- **No Sections**: Weekly goals use simple flat list (no Personal/Work categorization)
- **7-Day Reminder**: Banner appears on daily view if weekly goals not updated in 7+ days
- **History**: View last 12 weeks in WeeklyHistoryView
- **WhatsApp Export**: Formatted with week number and date range header

### UI/UX Design
- **Fixed Layout**: Header and footer are fixed, only the list area scrolls
  - Header contains title, date/week info, and status badge
  - Footer contains action buttons (Mark Complete, Copy, History)
  - Content area (list items) is independently scrollable
- **Mobile-First**: All components optimized for small screens first
- **Responsive Scrolling**: Content area uses flexbox with `min-h-0` to maintain proper scrolling within viewport height

### Subsections (Personal/Work)
- Users can optionally categorize items into "Personal" or "Work" sections
- Section dropdown appears above the "Add item" input in draft mode
- Selected section persists until changed
- Items display colored badges: blue for Personal, purple for Work
- WhatsApp formatting groups items by section:
  - No-section items appear first
  - Then `*Personal*` heading with personal items
  - Then `*Work*` heading with work items
  - Continuous sequential numbering across all sections

### Inline Editing
- In draft mode, click pencil icon to edit any item's text
- Edit mode shows input field with Save (check) and Cancel (X) buttons
- Keyboard shortcuts: Enter to save, Escape to cancel
- Auto-focuses the input field for immediate typing

### Revert to Draft
- Completed days/weeks can be reverted back to draft mode
- "Revert to Draft" button appears in footer when day/week is completed
- Allows making changes to items after initial completion
- Can re-complete the day/week after making changes

### WhatsApp Formatting
- **Title Format**:
  - Draft mode: `*Thursday, February 19 - Goals*` (no year)
  - Completed mode: `*Thursday, February 19 - Update*` (no year)
  - Weekly: `*Week 4 - 16 Feb - 22 Feb - Goals/Update*`
- **Item Numbering**:
  - Draft mode: Items prefixed with numbers `1.`, `2.`, `3.`
  - Completed mode: Items prefixed with emoji status `🟢`, `🟡`, `🔴` (replaces numbering)
- **Sections**: Daily lists group by Personal/Work with bold headers
- **Explanations**: Yellow emoji items can include optional explanations in parentheses

## Important Notes

### Data & Queries
- The application uses compound indexing in Convex for efficient queries:
  - Daily lists: `userId + date`
  - Weekly goals: `userId + weekStart`, `userId + year + weekNumber`
- All queries and mutations require a userId parameter to filter data by user
- Dates calculated server-side in Convex functions to ensure consistency
- Week calculations use ISO 8601 standard: Monday as week start, Sunday as end
- Weekly goals initialized lazily via mutation (queries are read-only)

### User & State Management
- User selection is stored in localStorage with key "userId" (values: "abraham", "carlo", "stefania")
- Both daily and weekly systems use dual-mode UI: "draft" (planning/editing) and "completed" (reviewing/rating)
- 7-day reminder threshold triggers when `lastUpdated` timestamp is 7+ days old

### WhatsApp Export
- Draft mode: Items numbered sequentially (1., 2., 3.)
- Completed mode: Emojis replace numbering (🟢, 🟡, 🔴)
- Titles include status suffix: "Goals" for draft, "Update" for completed
- Year omitted from date display for cleaner formatting
- Markdown-style bold headings for section grouping (daily lists only)
