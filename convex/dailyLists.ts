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

    const carriedOverItems =
      previousList?.items
        .filter((item) => item.emoji !== "green")
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
