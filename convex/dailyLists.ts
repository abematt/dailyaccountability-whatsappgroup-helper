import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const dailyItemValidator = v.object({
  text: v.string(),
  emoji: v.union(
    v.null(),
    v.literal("green"),
    v.literal("yellow"),
    v.literal("red")
  ),
  explanation: v.optional(v.string()),
  section: v.optional(v.union(v.literal("personal"), v.literal("work"))),
});

function getPreviousDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return utcDate.toISOString().slice(0, 10);
}

// Get today's list by local date (provided by client)
export const getTodaysList = query({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    return list;
  },
});

// Initialize today's list by carrying over yesterday's unfinished items.
export const initializeTodaysList = mutation({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const previousDate = getPreviousDate(args.date);
    const previousList = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", previousDate)
      )
      .first();

    // Auto-mark previous day's items as red and mark as completed if day was never completed
    if (previousList && previousList.status === "draft") {
      const autoMarkedItems = previousList.items.map((item) => ({
        ...item,
        emoji: item.emoji || ("red" as const), // Set null items to red, preserve existing emojis
      }));

      await ctx.db.patch(previousList._id, {
        items: autoMarkedItems,
        status: "completed", // Automatically mark previous day as completed
      });
    }

    // Carry-over logic based on previous day's status
    const carriedOverItems =
      previousList?.items
        .filter((item) => {
          // If previous day was completed, only carry over yellow/red
          if (previousList.status === "completed") {
            return item.emoji === "yellow" || item.emoji === "red";
          }
          // If previous day was draft (not marked), carry over all items
          return true;
        })
        .map((item) => ({
          text: item.text,
          emoji: null as null,
          section: item.section,
        })) || [];

    const id = await ctx.db.insert("dailyLists", {
      userId: args.userId,
      date: args.date,
      items: carriedOverItems,
      status: "draft",
    });

    return id;
  },
});

// Get a list by date
export const getListByDate = query({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    return list;
  },
});

// Get all lists ordered by date (most recent first)
export const getAllLists = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const lists = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return lists;
  },
});

// Create or update today's list
export const upsertTodaysList = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    items: v.array(dailyItemValidator),
    status: v.union(v.literal("draft"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        items: args.items,
        status: args.status,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("dailyLists", {
        userId: args.userId,
        date: args.date,
        items: args.items,
        status: args.status,
      });
      return id;
    }
  },
});

// Mark today's list as completed
export const markTodaysListCompleted = mutation({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "completed",
      });
      return existing._id;
    }
    return null;
  },
});

// Revert today's list back to draft
export const revertTodaysListToDraft = mutation({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "draft",
      });
      return existing._id;
    }
    return null;
  },
});

// Update items with emoji assignments
export const updateItemsWithEmojis = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    items: v.array(dailyItemValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        items: args.items,
      });
      return existing._id;
    }
    return null;
  },
});

// Migration: Mark all previous draft days as completed for ALL users
// Run this from Convex dashboard with: migrateDraftDaysToCompleted({ todayDate: "2026-03-13" })
export const migrateDraftDaysToCompleted = mutation({
  args: { todayDate: v.string() },
  handler: async (ctx, args) => {
    // Get all daily lists in the database
    const allLists = await ctx.db
      .query("dailyLists")
      .collect();

    let updatedCount = 0;
    const updatedByUser: Record<string, number> = {};

    for (const list of allLists) {
      // Only update lists that are:
      // 1. In draft status
      // 2. Before today (previous days)
      if (list.status === "draft" && list.date < args.todayDate) {
        // Mark all null emoji items as red
        const autoMarkedItems = list.items.map((item) => ({
          ...item,
          emoji: item.emoji || ("red" as const),
        }));

        // Update the list to completed status with marked items
        await ctx.db.patch(list._id, {
          items: autoMarkedItems,
          status: "completed",
        });

        updatedCount++;
        updatedByUser[list.userId] = (updatedByUser[list.userId] || 0) + 1;
      }
    }

    return {
      success: true,
      totalUpdated: updatedCount,
      updatedByUser,
    };
  },
});
