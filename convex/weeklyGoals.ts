import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentWeek, getPreviousWeekStart } from "./weekUtils";

// Get current week's goals (read-only)
export const getCurrentWeekGoals = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentWeek = getCurrentWeek();

    // Try to find existing week
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", currentWeek.weekStart)
      )
      .first();

    return existing || null;
  },
});

// Initialize current week with carryover logic (must be called explicitly)
export const initializeCurrentWeek = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentWeek = getCurrentWeek();

    // Check if week already exists
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", currentWeek.weekStart)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // If no current week exists, check for previous week to handle carryover
    const previousWeekStart = getPreviousWeekStart(currentWeek.weekStart);
    const previousWeek = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", previousWeekStart)
      )
      .first();

    // Determine which items to carry over
    let carriedOverItems: Array<{
      text: string;
      emoji: null;
      carriedOver: boolean;
    }> = [];

    if (previousWeek && previousWeek.items.length > 0) {
      if (previousWeek.status === "completed") {
        // Carry over only yellow and red items
        carriedOverItems = previousWeek.items
          .filter(item => item.emoji === "yellow" || item.emoji === "red")
          .map(item => ({
            text: item.text,
            emoji: null, // Reset emoji for new week
            carriedOver: true,
          }));
      } else {
        // Carry over all items if previous week was not completed
        carriedOverItems = previousWeek.items.map(item => ({
          text: item.text,
          emoji: null,
          carriedOver: true,
        }));
      }
    }

    // Create new week with carried over items
    const newWeekId = await ctx.db.insert("weeklyGoals", {
      userId: args.userId,
      weekStart: currentWeek.weekStart,
      weekEnd: currentWeek.weekEnd,
      weekNumber: currentWeek.weekNumber,
      year: currentWeek.year,
      status: "draft",
      lastUpdated: Date.now(),
      items: carriedOverItems,
    });

    return newWeekId;
  },
});

// Get goals by specific week start date
export const getGoalsByWeek = query({
  args: { userId: v.string(), weekStart: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", args.weekStart)
      )
      .first();

    return goals;
  },
});

// Get all weekly goals ordered by date (most recent first), limited to last 12 weeks
export const getAllWeeklyGoals = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const allGoals = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(12); // Limit to last 12 weeks

    return allGoals;
  },
});

// Create or update current week's goals
export const upsertCurrentWeekGoals = mutation({
  args: {
    userId: v.string(),
    items: v.array(
      v.object({
        text: v.string(),
        emoji: v.union(
          v.null(),
          v.literal("green"),
          v.literal("yellow"),
          v.literal("red")
        ),
        explanation: v.optional(v.string()),
        carriedOver: v.optional(v.boolean()),
      })
    ),
    status: v.union(v.literal("draft"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const currentWeek = getCurrentWeek();
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", currentWeek.weekStart)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        items: args.items,
        status: args.status,
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("weeklyGoals", {
        userId: args.userId,
        weekStart: currentWeek.weekStart,
        weekEnd: currentWeek.weekEnd,
        weekNumber: currentWeek.weekNumber,
        year: currentWeek.year,
        items: args.items,
        status: args.status,
        lastUpdated: Date.now(),
      });
      return id;
    }
  },
});

// Mark current week as completed
export const markCurrentWeekCompleted = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentWeek = getCurrentWeek();
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", currentWeek.weekStart)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "completed",
        lastUpdated: Date.now(),
      });
      return existing._id;
    }
    return null;
  },
});

// Revert current week back to draft
export const revertCurrentWeekToDraft = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentWeek = getCurrentWeek();
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", currentWeek.weekStart)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "draft",
        lastUpdated: Date.now(),
      });
      return existing._id;
    }
    return null;
  },
});

// Update items with emoji assignments
export const updateWeekItemsWithEmojis = mutation({
  args: {
    userId: v.string(),
    items: v.array(
      v.object({
        text: v.string(),
        emoji: v.union(
          v.null(),
          v.literal("green"),
          v.literal("yellow"),
          v.literal("red")
        ),
        explanation: v.optional(v.string()),
        carriedOver: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const currentWeek = getCurrentWeek();
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", currentWeek.weekStart)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        items: args.items,
        lastUpdated: Date.now(),
      });
      return existing._id;
    }
    return null;
  },
});

// Get days since last update for 7-day reminder
export const getDaysSinceLastUpdate = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentWeek = getCurrentWeek();
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", currentWeek.weekStart)
      )
      .first();

    if (!existing) {
      // Check if there's any previous week
      const allGoals = await ctx.db
        .query("weeklyGoals")
        .withIndex("by_user_and_week", (q) => q.eq("userId", args.userId))
        .order("desc")
        .first();

      if (!allGoals) {
        return 0; // No goals ever created
      }

      // Calculate days since last goal was updated
      const daysSince = Math.floor((Date.now() - allGoals.lastUpdated) / (1000 * 60 * 60 * 24));
      return daysSince;
    }

    // Calculate days since current week was last updated
    const daysSince = Math.floor((Date.now() - existing.lastUpdated) / (1000 * 60 * 60 * 24));
    return daysSince;
  },
});
