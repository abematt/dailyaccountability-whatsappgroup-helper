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
});
