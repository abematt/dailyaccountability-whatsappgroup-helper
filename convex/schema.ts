import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  dailyLists: defineTable({
    userId: v.string(), // User identifier: "abraham", "carlo", or "stefania"
    date: v.string(), // Format: YYYY-MM-DD
    status: v.union(v.literal("draft"), v.literal("completed")),
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
  })
    .index("by_date", ["date"])
    .index("by_user_and_date", ["userId", "date"]),

  weeklyGoals: defineTable({
    userId: v.string(), // User identifier: "abraham", "carlo", or "stefania"
    weekStart: v.string(), // Monday of the week, Format: YYYY-MM-DD
    weekEnd: v.string(), // Sunday of the week, Format: YYYY-MM-DD
    weekNumber: v.number(), // ISO week number (1-53)
    year: v.number(), // Year for the week
    status: v.union(v.literal("draft"), v.literal("completed")),
    lastUpdated: v.number(), // Timestamp for tracking 7-day reminder
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
        carriedOver: v.optional(v.boolean()), // Flag for visual indicator
      })
    ),
  })
    .index("by_week_start", ["weekStart"])
    .index("by_user_and_week", ["userId", "weekStart"])
    .index("by_user_year_week", ["userId", "year", "weekNumber"]),
});
