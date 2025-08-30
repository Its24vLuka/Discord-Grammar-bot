import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  corrections: defineTable({
    originalMessage: v.string(),
    correctedMessage: v.string(),
    userId: v.string(),
    channelId: v.string(),
    guildId: v.string(),
    messageId: v.string(),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_channel", ["channelId"])
    .index("by_guild", ["guildId"])
    .index("by_message", ["messageId"]),
  
  botSettings: defineTable({
    guildId: v.string(),
    enabled: v.boolean(),
    ignoredChannels: v.array(v.string()),
    ignoredUsers: v.array(v.string()),
    correctionThreshold: v.optional(v.number()), // Minimum confidence level for corrections
    replyMode: v.optional(v.string()), // "reply", "dm", or "channel"
  }).index("by_guild", ["guildId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
