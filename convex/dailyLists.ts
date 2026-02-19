import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get today's list or create a new draft if it doesn't exist
export const getTodaysList = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const list = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    return list;
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
        section: v.optional(v.union(
          v.literal("personal"),
          v.literal("work")
        )),
      })
    ),
    status: v.union(v.literal("draft"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
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
        date: today,
        items: args.items,
        status: args.status,
      });
      return id;
    }
  },
});

// Mark today's list as completed
export const markTodaysListCompleted = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
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
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
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
        section: v.optional(v.union(
          v.literal("personal"),
          v.literal("work")
        )),
      })
    ),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("dailyLists")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
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
