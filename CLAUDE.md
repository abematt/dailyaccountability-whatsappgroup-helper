# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT**: When making changes to features, UI/UX, or architecture, always update this CLAUDE.md file to reflect those changes. If changes are reverted, update the documentation accordingly.

## Project Overview

This is a **mobile-first** React-based daily accountability tracking application that allows multiple users (Abraham, Carlo, Stefania) to create daily task lists, mark items as complete/partial/incomplete with emoji indicators, and export formatted lists for WhatsApp. The application uses Convex as the backend database with simple localStorage-based user selection.

**Design Philosophy**: All UI components and layouts should prioritize mobile devices. Design for small screens first, then enhance for larger viewports if needed.

**User System**: Simple username-based separation with no authentication. Users select their profile on first visit, and the selection persists in localStorage. Each user sees only their own lists.

**Weekly Features Status**: The weekly goals system (including the weekly goals button and 7-day reminder banner) is currently **temporarily hidden** via code comments in [AccountabilityApp.tsx](src/components/AccountabilityApp.tsx). The backend functionality and WeeklyGoalsApp component remain fully functional and can be re-enabled by uncommenting the relevant code sections.

## Development Commands

### Running the Application
```bash
npm run dev          # Start Vite dev server (frontend) with dev Convex
npx convex dev       # Start Convex backend in development mode
```

You need to run BOTH commands concurrently in separate terminals for full functionality.

**Testing with Production Convex:**
```bash
npm run dev -- --mode production  # Use production Convex backend with local frontend
```
This loads `.env.production` instead of `.env.development`, allowing you to test against production data locally.

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
- **Daily Lists Functions**: [convex/dailyLists.ts](convex/dailyLists.ts) - Contains queries and mutations (all require userId parameter, most require date parameter):
  - `getTodaysList` - Fetches today's list for a specific user (requires userId and date)
  - `getListByDate` - Fetches a specific date's list for a user
  - `getAllLists` - Fetches all historical lists for a user
  - `getListsByMonth` - **Efficient month-specific query** - Fetches lists for a specific month (requires userId and yearMonth in "YYYY-MM" format). More efficient than getAllLists for history browsing.
  - `getAvailableMonths` - Returns array of months that have entries for a user (["YYYY-MM"] format, sorted descending). Used for smart navigation boundaries.
  - `initializeTodaysList` - Creates new day with auto-carryover from previous day (carries over non-green items). **Automatically marks previous draft days as completed with all unrated items marked as red**
  - `upsertTodaysList` - Creates or updates today's list for a user (includes userId, date, and section field)
  - `markTodaysListCompleted` - Marks today's list as completed for a user
  - `revertTodaysListToDraft` - Reverts a completed day back to draft mode for a user
  - `updateItemsWithEmojis` - Updates emoji assignments for items for a user
  - `migrateDraftDaysToCompleted` - Admin/migration function to mark all previous draft days as completed for all users
- **Weekly Goals Functions** *(UI temporarily hidden)*: [convex/weeklyGoals.ts](convex/weeklyGoals.ts) - Contains queries and mutations for weekly goals:
  - `getCurrentWeekGoals` - Fetches current week's goals for a user
  - `initializeCurrentWeek` - Creates new week with auto-carryover from previous week
  - `getGoalsByWeek` - Fetches specific week's goals by weekStart date
  - `getAllWeeklyGoals` - Fetches last 12 weeks of goals for a user
  - `upsertCurrentWeekGoals` - Creates or updates current week's goals
  - `markCurrentWeekCompleted` - Marks current week as completed
  - `revertCurrentWeekToDraft` - Reverts current week back to draft mode
  - `updateWeekItemsWithEmojis` - Updates emoji assignments for weekly items
  - `getDaysSinceLastUpdate` - Returns days since last weekly update (for 7-day reminder, currently hidden)
- **Week Utilities**: [convex/weekUtils.ts](convex/weekUtils.ts) - Week calculation helpers using ISO 8601 standard (Monday-Sunday)

### Frontend: React + TypeScript + Vite
- **Main Components**:
  - [src/components/AccountabilityApp.tsx](src/components/AccountabilityApp.tsx) - Main application interface for managing today's list, handles user selection *(weekly button and reminder banner temporarily hidden via comments)*
  - [src/components/HistoryView.tsx](src/components/HistoryView.tsx) - **Month-based history browser** for past days' lists with efficient data loading. Shows one month at a time with navigation controls and loading skeletons. Uses `getListsByMonth` and `getAvailableMonths` queries.
  - [src/components/WeeklyGoalsApp.tsx](src/components/WeeklyGoalsApp.tsx) - Weekly goals interface with simplified list (no sections) *(currently inaccessible from UI)*
  - [src/components/WeeklyHistoryView.tsx](src/components/WeeklyHistoryView.tsx) - View for browsing past weeks' goals (last 12 weeks) *(currently inaccessible from UI)*
  - [src/components/UserPicker.tsx](src/components/UserPicker.tsx) - Full-screen user selection interface with avatar cards
  - [src/components/UserAvatar.tsx](src/components/UserAvatar.tsx) - Small avatar badge displayed in top-right corner
- **UI Components**: [src/components/ui/](src/components/ui/) - shadcn/ui components (radix-maia style)
- **Entry Point**: [src/main.tsx](src/main.tsx) - Initializes Convex client with `VITE_CONVEX_URL` environment variable

### Data Flow

#### Daily Lists Flow
1. **User Selection**: On first visit, user selects their profile (Abraham/Carlo/Stefania) from UserPicker
   - Selection stored in localStorage as userId
   - Small avatar badge appears in top-right corner showing current user
2. **Auto-Carryover**: When accessing a new day, the system automatically:
   - Creates new day entry via `initializeTodaysList` mutation
   - **Auto-marks and completes previous draft days**: If previous day status is "draft" (never completed), the system automatically:
     - Marks all unrated items as red (incomplete)
     - Changes the day's status from "draft" to "completed"
     - This ensures previous days are never left in "draft"/"in progress" state
   - Checks previous day's status and carries over incomplete items:
     - If previous day was **completed**: only items marked yellow/red are carried over
     - If previous day was **draft** (auto-completed as described above): ALL items are carried over
     - Items marked green (complete) are NOT carried over
     - Carried items have their emoji status reset to null (unrated)
   - Empty previous day: starts with empty list
3. User creates a daily list in "draft" mode (can add/remove/edit items)
   - Optional: User can assign items to "Personal" or "Work" sections via dropdown selector
   - Each item has a section dropdown to change categorization after creation
   - Inline editing: Click pencil icon to edit item text
   - **Quick complete**: Click green checkmark button to mark item as complete without full review
4. User marks the day as "completed" (locks the list for review)
5. In completed mode, user assigns emoji status to each item:
   - 🟢 Green = completed successfully
   - 🟡 Yellow = partially completed (with optional explanation)
   - 🔴 Red = not completed
6. User can revert completed day back to "draft" to make changes
7. User can copy formatted list to clipboard for WhatsApp sharing
   - WhatsApp formatting groups items by section with headers
8. **History Browsing**: View past days organized by month in HistoryView
   - **Month Navigation**: Forward/backward buttons to browse months chronologically
   - **Smart Boundaries**: Navigation buttons disabled at oldest month (with entries) and current month
   - **Efficient Loading**: Only loads one month's data at a time via `getListsByMonth` query
   - **Loading States**: Skeleton cards appear while fetching month data
   - **Available Months**: Uses `getAvailableMonths` query to determine which months have entries
9. **Historical Editing**: Users can view and mark emoji status for any past day in HistoryView
   - Click "Edit" button in header to enter edit mode
   - For completed days: change emoji status (🟢🟡🔴) and add explanations (saved live)
   - For draft days: "Mark Day Completed" transitions to emoji marking mode
   - No add/edit/delete functionality - items are read-only
   - All changes save automatically to database

#### Weekly Goals Flow *(Currently Hidden from UI)*
**Note**: The weekly goals functionality is temporarily hidden from the UI but remains fully functional in the backend. To re-enable, uncomment the weekly button and reminder banner in [AccountabilityApp.tsx](src/components/AccountabilityApp.tsx).

1. ~~User clicks "Weekly" button in navbar to access WeeklyGoalsApp~~ *(Button currently hidden)*
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
8. ~~**7-Day Reminder**: If weekly goals haven't been updated in 7+ days, a banner appears on main daily view prompting update~~ *(Banner currently hidden)*

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
- **Abraham** - Avatar with initial (A)
- **Carlo** - Avatar with initial (C)
- **Stefania** - Avatar with initial (S)

**Note**: All user avatars use the theme's primary color (`bg-primary`) rather than user-specific colors. The avatar appearance adapts to the current theme.

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
- Environment files control which Convex backend to use:
  - `.env.development` - Development Convex backend (default for `npm run dev`)
  - `.env.production` - Production Convex backend (used with `npm run dev -- --mode production`)
  - `.env.local` - Local overrides (gitignored, not committed)
- Key variables:
  - `VITE_CONVEX_URL` - Convex backend URL
  - `CONVEX_DEPLOYMENT` - Deployment identifier for Convex CLI
  - `VITE_CONVEX_SITE_URL` - Convex site URL

## Key Features

### User Selection
- Simple localStorage-based user selection (no authentication)
- Three predefined users: Abraham, Carlo, Stefania
- Full-screen picker on first visit with avatar cards
- Small avatar badge in top-right corner shows current user
- Each user sees only their own lists, weekly goals, and history
- No logout functionality - users stay logged in via localStorage

### Weekly Goals System *(Temporarily Hidden)*
**Status**: This feature is temporarily hidden from the UI. The backend remains fully functional. To restore:
1. Uncomment the weekly button code in [AccountabilityApp.tsx](src/components/AccountabilityApp.tsx) (lines ~428-437)
2. Uncomment the 7-day reminder banner code (lines ~452-485)

- ~~**Navigation**: Calendar icon button in navbar opens weekly goals section~~ *(Hidden)*
- **Week Display**: Shows "Week X - DD Mon - DD Mon" format (e.g., "Week 4 - 16 Feb - 22 Feb")
- **Auto-Carryover**: When accessing a new week (Monday start):
  - If previous week was completed: carries over only yellow/red items
  - If previous week was not marked: carries over all items
  - Empty previous week: starts with empty list
- **Carried Over Badge**: Items carried from previous week show amber "Carried Over" badge
- **No Sections**: Weekly goals use simple flat list (no Personal/Work categorization)
- ~~**7-Day Reminder**: Banner appears on daily view if weekly goals not updated in 7+ days~~ *(Hidden)*
- **History**: View last 12 weeks in WeeklyHistoryView
- **WhatsApp Export**: Formatted with week number and date range header

### UI/UX Design
- **Fixed Layout**: Header and footer are fixed, only the list area scrolls
  - Header contains title, date/week info, and status badge
  - Footer contains action buttons (Mark Complete, Copy, History)
  - Content area (list items) is independently scrollable
- **Mobile-First**: All components optimized for small screens first
- **Responsive Scrolling**: Content area uses flexbox with `min-h-0` to maintain proper scrolling within viewport height
- **List Spacing**: Bottom padding added to prevent items from crowding the footer/bottom edge
  - Today's list: `pb-4` (16px) spacing in [AccountabilityApp.tsx:609](src/components/AccountabilityApp.tsx#L609)
  - Previous days (view mode): `pb-8` (32px) spacing in HistoryView
  - Previous days (edit mode): `pb-8` (32px) spacing in HistoryView
- **Loading States**: Skeleton UI patterns for smooth data fetching experience
  - History month view: 3 skeleton cards with pulse animation while loading ([HistoryView.tsx:291-298](src/components/HistoryView.tsx#L291-L298))

### Subsections (Personal/Work)
- Users can optionally categorize items into "Personal" or "Work" sections
- Section dropdown appears above the "Add item" input in draft mode to set default section for new items
- **Per-Item Section Editing**: Each item in draft mode has its own dropdown to change section after creation
  - Dropdown shows "No Section", "Personal", or "Work" options
  - Section can be changed independently for each item at any time in draft mode
  - In completed mode, sections display as static colored badges (not editable)
- Selected section persists until changed
- Items display colored badges: blue for Personal, purple for Work
- WhatsApp formatting groups items by section:
  - No-section items appear first
  - Then `*Personal*` heading with personal items
  - Then `*Work*` heading with work items
  - Continuous sequential numbering across all sections

### Inline Editing & Edit Mode
- In draft mode, click pencil icon button to enter edit mode for any item
- Edit mode shows a unified interface with:
  - **Text input field** with auto-focus for immediate editing
  - **Save button** (floppy disk icon) to save changes
  - **Section selector dropdown** below (Personal/Work/No Section)
  - **Delete button** below to remove the item
- The pencil button transforms into the edit interface - no separate "Edit" button needed
- **Keyboard shortcuts**: Enter to save, Escape to cancel
- **Auto-save on edit**: Changes clear properly when deleting items in edit mode
- Text is **not directly clickable** - must use pencil button to enter edit mode
- **Icon distinction**:
  - Quick complete uses checkmark icon (✓)
  - Edit mode save uses floppy disk icon (💾)
- Available only in draft mode
- See [AccountabilityApp.tsx:618-706](src/components/AccountabilityApp.tsx#L618-L706) for implementation

### Quick Complete
- **Individual item completion** available in draft mode
- Green checkmark button appears next to each item
- Click to toggle item between complete (green) and unmarked (null)
- Visual feedback: item background turns light green when marked complete
- Marked items persist through "Mark Day Completed" action
- Provides quick completion without full day review

### History View & Month Navigation
- **Month-by-Month Browsing**: History organized by calendar month for clean, efficient navigation
- **Month Navigation Controls**:
  - Previous/Next month buttons with chevron icons
  - Current month displayed in center (e.g., "March 2026")
  - **Smart boundaries**: Buttons automatically disable when at limits
    - Previous button: disabled at oldest month with entries
    - Next button: disabled at current month (can't browse future)
- **Efficient Data Loading**:
  - Uses `getListsByMonth(userId, yearMonth)` to fetch only current month's data
  - Uses `getAvailableMonths(userId)` to determine navigation boundaries
  - Avoids loading entire history - only fetches what's needed
- **Loading Experience**:
  - Shows 3 skeleton cards with pulse animation while fetching
  - Smooth transition to actual data when loaded
  - "No entries this month" message for empty months
- **Day Selection**: Click any day card to view/edit details in right panel (desktop) or full screen (mobile)

### Historical Day Editing
- **Simplified editing** for any past day via HistoryView
- **Edit/View toggle** button appears next to the status badge in the header
  - Click "Edit" (pencil icon) to enter edit mode
  - Click "View" (X icon) to exit edit mode - button turns amber when in edit mode
  - Visual feedback: button color changes to amber when editing is active
- **Edit mode functionality (read-only items, emoji marking with auto-save)**:
  - **For completed days**: Assign or change emoji status (🟢🟡🔴) with optional explanations for yellow items
  - **For draft days**: "Mark Day Completed" button transitions day to completed status and shows emoji marking UI
  - **No revert to draft**: Previous days cannot be reverted back to draft status - once completed, they stay completed
  - **No add/edit/delete**: Cannot add new items, edit item text, or delete items
  - **No section changes**: Sections display as static badges, not editable
  - **Save behavior**:
    - Emoji changes save immediately to database when clicked
    - Explanation text updates local state while typing, saves to database on blur (when you click away from the textarea)
    - This prevents re-rendering bugs that would interrupt fast typing
- "Copy for WhatsApp" button available in both view and edit modes
- No time restrictions - edit any historical day

### Revert to Draft
- **Today's list only**: Only the current day can be reverted back to draft mode
- "Back to Goals" button appears in footer when today's list is completed
- Allows making changes to items after initial completion
- Can re-complete the day after making changes
- **Previous days cannot be reverted**: Historical days remain in completed status to maintain accountability

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

### Animation System
- Built with **Framer Motion** library for smooth, performant transitions
- **List Item Animations** (Today's list):
  - Staggered entrance animations (items appear sequentially with slight delay)
  - Fade + slide transitions for smooth visual feedback (opacity and y-axis)
  - **No zoom/scale animations** - removed to prevent jarring visual effects
  - **No layout prop** on list items - prevents automatic layout animations that cause unwanted scaling
  - See [AccountabilityApp.tsx:595-606](src/components/AccountabilityApp.tsx#L595-L606) for configuration
- **History View**:
  - **No stagger animations** - removed for instant display of history items
  - Loading skeleton uses CSS `animate-pulse` for subtle breathing effect
  - Smooth transitions between months via React state changes
- **Mode Transitions**:
  - Animated transitions between view/edit modes in HistoryView
  - Slide animations when switching between draft and completed states
- **Banner Animations**:
  - Weekly reminder banner uses entrance/exit animations
  - Smooth slide-in from top with fade effect
- **UI Component Animations**:
  - Edit mode panel expansion/collapse (height and opacity)
  - Button hover effects and state changes
  - Card elevation transitions on hover
- **AnimatePresence**: Used for exit animations when items are removed from the DOM

### Performance Optimizations
- **Month-Based Data Fetching**: History view loads only one month at a time instead of all historical data
  - Uses `getListsByMonth` query with yearMonth parameter (e.g., "2026-03")
  - Significantly reduces data transfer and rendering cost as history grows
  - Month changes trigger new focused queries rather than filtering client-side
- **Available Months Cache**: Single `getAvailableMonths` query provides navigation metadata
  - Returns lightweight array of month strings (["2026-03", "2026-02", ...])
  - Used to determine navigation boundaries without loading all data
  - Enables smart disable states on navigation buttons
- **Data Preloading**: Weekly goals data is preloaded in AccountabilityApp for smooth transitions when navigating to weekly view
- **Lazy Initialization**: Both daily lists and weekly goals are initialized on first access via mutations (queries remain read-only)
- **Compound Indexing**: Convex database uses compound indexes for efficient queries (userId + date, userId + weekStart)
- **Client-Side Date Calculation**: Dates calculated on client and passed as parameters to reduce server-side computation
- **Conditional Queries**: Queries skip execution when userId is not available (`userId ? { userId } : "skip"`)
- **Loading Skeletons**: Skeleton UI prevents layout shift and provides immediate visual feedback during data fetching

## Important Notes

### Data & Queries
- The application uses compound indexing in Convex for efficient queries:
  - Daily lists: `userId + date`
  - Weekly goals: `userId + weekStart`, `userId + year + weekNumber`
- All queries and mutations require a userId parameter to filter data by user
- **Date Handling**: Dates are calculated client-side and passed to Convex functions as parameters
  - Client uses `getLocalDateString()` helper to ensure consistent YYYY-MM-DD formatting
  - Most daily list functions require both `userId` and `date` parameters
  - Month-based queries use "YYYY-MM" format (e.g., `getListsByMonth` takes `yearMonth: "2026-03"`)
- Week calculations use ISO 8601 standard: Monday as week start, Sunday as end
- Both daily lists and weekly goals are initialized lazily via mutations (queries are read-only)
- **History Queries**:
  - `getAllLists` - Fetches all history (used in main app, less efficient for large datasets)
  - `getListsByMonth` - Fetches single month (preferred for history browsing, scales better)
  - `getAvailableMonths` - Returns metadata about which months exist (lightweight, enables smart navigation)

### User & State Management
- User selection is stored in localStorage with key "userId" (values: "abraham", "carlo", "stefania")
- Both daily and weekly systems use dual-mode UI: "draft" (planning/editing) and "completed" (reviewing/rating)
- **Previous days are always completed**: There is no concept of "in progress" for past days. When moving to a new day, any previous draft day is automatically marked as completed with all unrated items marked as red
- 7-day reminder threshold triggers when `lastUpdated` timestamp is 7+ days old

### WhatsApp Export
- Draft mode: Items numbered sequentially (1., 2., 3.)
- Completed mode: Emojis replace numbering (🟢, 🟡, 🔴)
- Titles include status suffix: "Goals" for draft, "Update" for completed
- Year omitted from date display for cleaner formatting
- Markdown-style bold headings for section grouping (daily lists only)
