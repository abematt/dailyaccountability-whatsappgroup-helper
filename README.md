# Daily Accountability Tracker

A mobile-first React application for tracking daily tasks and weekly goals with multiple user profiles. Built for sharing progress updates on WhatsApp.

## Features

### 📱 Mobile-First Design
- Optimized for small screens with responsive layouts
- Fixed header/footer with scrollable content area
- Clean, modern UI using shadcn/ui components

### 👥 Multi-User Support
- Three user profiles (Abraham, Carlo, Stefania)
- localStorage-based profile selection
- Per-user task lists and history

### ✅ Daily Task Management
- Create daily task lists with optional Personal/Work sections
- Streamlined inline editing with save button
- Quick complete button for individual items
- Mark days as completed and rate tasks with emoji status:
  - 🟢 Completed successfully
  - 🟡 Partially completed (with optional explanation)
  - 🔴 Not completed

### 📅 Weekly Goals *(Temporarily Unavailable)*
**Note**: Weekly goals functionality is currently hidden from the UI but remains available in the codebase.
- Set weekly goals with automatic carryover of incomplete items
- ISO 8601 week standard (Monday-Sunday)
- ~~7-day reminder when goals haven't been updated~~ *(Hidden)*
- Historical view of last 12 weeks

### 📝 Smart Carryover Logic
- **Daily**: Incomplete tasks automatically carry over to next day
  - Unmarked draft days: all items marked red and carried over
  - Completed days: only yellow/red items carried over
- **Weekly**: Similar logic for weekly goal carryover

### 📋 Historical Editing
- View and edit any past day's task list
- Mark emoji status for completed days
- Live updates - changes save automatically

### 💬 WhatsApp Export
- One-click copy formatted lists for WhatsApp sharing
- Different formats for draft vs. completed lists
- Grouped by sections with proper numbering

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Convex (serverless database)
- **UI**: shadcn/ui (radix-maia) + Tailwind CSS v4
- **Icons**: Tabler Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd accountability-help
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local with your Convex URL
VITE_CONVEX_URL=<your-convex-url>
CONVEX_DEPLOYMENT=<your-deployment>
VITE_CONVEX_SITE_URL=<your-site-url>
```

### Development

Run both the frontend and backend concurrently:

```bash
# Terminal 1 - Frontend dev server
npm run dev

# Terminal 2 - Convex backend
npx convex dev
```

The application will be available at `http://localhost:5173`

### Testing with Production

To test against production Convex backend locally:

```bash
npm run dev -- --mode production
```

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
├── convex/              # Convex backend functions and schema
│   ├── dailyLists.ts   # Daily task queries and mutations
│   ├── weeklyGoals.ts  # Weekly goal queries and mutations
│   └── schema.ts       # Database schema
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # shadcn/ui components
│   │   ├── AccountabilityApp.tsx
│   │   ├── HistoryView.tsx
│   │   ├── WeeklyGoalsApp.tsx
│   │   └── ...
│   └── main.tsx       # Application entry point
└── CLAUDE.md          # Detailed project documentation
```

## Key Concepts

### Dual-Mode UI
- **Draft Mode**: Planning and editing tasks
- **Completed Mode**: Reviewing and rating task completion

### Auto-Marking
- Unmarked draft days are automatically marked as incomplete (red) when a new day starts
- This ensures nothing falls through the cracks

### Status-Based Carryover
- System intelligently carries over tasks based on previous day/week completion status
- Prevents duplicate work while ensuring incomplete items stay visible

## Configuration

- Path aliases: `@/*` maps to `src/*`
- shadcn/ui style: radix-maia with stone base color
- Environment files: `.env.development`, `.env.production`, `.env.local`

## Documentation

For detailed development guidelines and architecture documentation, see [CLAUDE.md](CLAUDE.md).

## License

[Add your license here]

---

Built with ❤️ for daily accountability and progress tracking
