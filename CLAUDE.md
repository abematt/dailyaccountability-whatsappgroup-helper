# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **mobile-first** React-based daily accountability tracking application that allows users to create daily task lists, mark items as complete/partial/incomplete with emoji indicators, and export formatted lists for WhatsApp. The application uses Convex as the backend database.

**Design Philosophy**: All UI components and layouts should prioritize mobile devices. Design for small screens first, then enhance for larger viewports if needed.

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
- **Schema**: [convex/schema.ts](convex/schema.ts) - Defines the `dailyLists` table with date-indexed entries
- **Functions**: [convex/dailyLists.ts](convex/dailyLists.ts) - Contains queries and mutations for:
  - `getTodaysList` - Fetches today's list
  - `getListByDate` - Fetches a specific date's list
  - `getAllLists` - Fetches all historical lists
  - `upsertTodaysList` - Creates or updates today's list
  - `markTodaysListCompleted` - Marks today's list as completed
  - `updateItemsWithEmojis` - Updates emoji assignments for items

### Frontend: React + TypeScript + Vite
- **Main Components**:
  - [src/components/AccountabilityApp.tsx](src/components/AccountabilityApp.tsx) - Main application interface for managing today's list
  - [src/components/HistoryView.tsx](src/components/HistoryView.tsx) - View for browsing past days' lists
- **UI Components**: [src/components/ui/](src/components/ui/) - shadcn/ui components (radix-maia style)
- **Entry Point**: [src/main.tsx](src/main.tsx) - Initializes Convex client with `VITE_CONVEX_URL` environment variable

### Data Flow
1. User creates a daily list in "draft" mode (can add/remove items)
2. User marks the day as "completed" (locks the list)
3. In completed mode, user assigns emoji status to each item:
   - 🟢 Green = completed successfully
   - 🟡 Yellow = partially completed (with optional explanation)
   - 🔴 Red = not completed
4. User can copy formatted list to clipboard for WhatsApp sharing
5. Historical lists are viewable in the HistoryView component

### Key Data Structure
```typescript
{
  date: string,              // YYYY-MM-DD format
  status: "draft" | "completed",
  items: Array<{
    text: string,
    emoji: "green" | "yellow" | "red" | null,
    explanation?: string     // Only for yellow items
  }>
}
```

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

## Important Notes

- The application uses date-based indexing in Convex for efficient queries
- Today's date is calculated server-side in Convex functions to ensure consistency
- The UI has two distinct modes: "draft" (for planning) and "completed" (for reviewing)
- WhatsApp formatting includes markdown-style bold headings and emoji indicators
