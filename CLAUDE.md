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
- **Schema**: [convex/schema.ts](convex/schema.ts) - Defines the `dailyLists` table with userId and date compound-indexed entries
- **Functions**: [convex/dailyLists.ts](convex/dailyLists.ts) - Contains queries and mutations (all require userId parameter):
  - `getTodaysList` - Fetches today's list for a specific user
  - `getListByDate` - Fetches a specific date's list for a user
  - `getAllLists` - Fetches all historical lists for a user
  - `upsertTodaysList` - Creates or updates today's list for a user (includes userId and section field)
  - `markTodaysListCompleted` - Marks today's list as completed for a user
  - `revertTodaysListToDraft` - Reverts a completed day back to draft mode for a user
  - `updateItemsWithEmojis` - Updates emoji assignments for items for a user

### Frontend: React + TypeScript + Vite
- **Main Components**:
  - [src/components/AccountabilityApp.tsx](src/components/AccountabilityApp.tsx) - Main application interface for managing today's list, handles user selection
  - [src/components/HistoryView.tsx](src/components/HistoryView.tsx) - View for browsing past days' lists (filtered by user)
  - [src/components/UserPicker.tsx](src/components/UserPicker.tsx) - Full-screen user selection interface with avatar cards
  - [src/components/UserAvatar.tsx](src/components/UserAvatar.tsx) - Small avatar badge displayed in top-right corner
- **UI Components**: [src/components/ui/](src/components/ui/) - shadcn/ui components (radix-maia style)
- **Entry Point**: [src/main.tsx](src/main.tsx) - Initializes Convex client with `VITE_CONVEX_URL` environment variable

### Data Flow
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

### Key Data Structure
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
- Each user sees only their own lists and history
- No logout functionality - users stay logged in via localStorage

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
- Completed days can be reverted back to draft mode
- "Revert to Draft" button appears in footer when day is completed
- Allows making changes to items after initial completion
- Can re-complete the day after making changes

## Important Notes

- The application uses compound indexing (userId + date) in Convex for efficient queries
- All queries and mutations require a userId parameter to filter data by user
- Today's date is calculated server-side in Convex functions to ensure consistency
- The UI has two distinct modes: "draft" (for planning/editing) and "completed" (for reviewing/rating)
- WhatsApp formatting includes markdown-style bold headings, emoji indicators, and section grouping
- All mutations validate the `section` and `userId` fields to match the schema
- User selection is stored in localStorage with key "userId" (values: "abraham", "carlo", "stefania")
