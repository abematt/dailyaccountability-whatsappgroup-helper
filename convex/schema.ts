import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  dailyLists: defineTable({
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
      })
    ),
  }).index("by_date", ["date"]),
});
